import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build";

const config = new pulumi.Config();

// ============================================================================
// RDS POSTGRESQL (Banco de Dados Gerenciado)
// ============================================================================
const dbPassword = config.requireSecret("dbPassword");
const jwtSecret = config.requireSecret("jwtSecret");

// Usar VPC padrão da AWS
const defaultVpc = pulumi.output(aws.ec2.getVpc({ default: true }));
const defaultSubnets = defaultVpc.apply((vpc) =>
	aws.ec2.getSubnets({
		filters: [{ name: "vpc-id", values: [vpc.id] }],
	}),
);

const dbSubnetGroup = new aws.rds.SubnetGroup("deploy-db-subnet", {
	subnetIds: defaultSubnets.apply((subnets) => subnets.ids),
});

const dbSecurityGroup = new aws.ec2.SecurityGroup("deploy-db-sg", {
	vpcId: defaultVpc.apply((vpc) => vpc.id),
	ingress: [
		{
			protocol: "tcp",
			fromPort: 5432,
			toPort: 5432,
			cidrBlocks: ["0.0.0.0/0"], // Melhor prática: restringir ao security group do ECS
		},
	],
	egress: [
		{
			protocol: "-1",
			fromPort: 0,
			toPort: 0,
			cidrBlocks: ["0.0.0.0/0"],
		},
	],
});

const db = new aws.rds.Instance("deploy-db", {
	allocatedStorage: 20,
	engine: "postgres",
	instanceClass: "db.t3.micro",
	dbName: "minhacidade_backend",
	username: "postgres",
	password: dbPassword,
	dbSubnetGroupName: dbSubnetGroup.name,
	vpcSecurityGroupIds: [dbSecurityGroup.id],
	skipFinalSnapshot: true,
	publiclyAccessible: true, // Temporário para seed, depois mudar para false
	backupRetentionPeriod: 0, // Free tier: sem backups
	tags: {
		Name: "minhacidade-backend-db",
		Environment: "production",
	},
});

// ============================================================================
// ECR REPOSITORY - BACKEND
// ============================================================================
const repository = new awsx.ecr.Repository("deploy-ecr-repo");

// ============================================================================
// DOCKER IMAGE BUILD & PUSH
// ============================================================================
const { userName, password } = aws.ecr.getAuthorizationTokenOutput({
	registryId: repository.repository.registryId,
});

const image = new docker.Image("deploy-docker-image", {
	context: {
		location: "../",
	},
	platforms: ["linux/amd64"],
	push: true,
	registries: [
		{
			address: repository.repository.repositoryUrl,
			username: userName,
			password: password,
		},
	],
	tags: [pulumi.interpolate`${repository.repository.repositoryUrl}:latest`],
});

// ============================================================================
// CLOUDWATCH LOG GROUP
// ============================================================================
const logGroup = new aws.cloudwatch.LogGroup("deploy-ecs-logs", {
	name: "/ecs/deploy-ecs-app",
	retentionInDays: 7,
});

// ============================================================================
// ECS CLUSTER
// ============================================================================
const cluster = new awsx.classic.ecs.Cluster("deploy-ecs-cluster");

// ============================================================================
// LOAD BALANCER
// ============================================================================
const lb = new awsx.classic.lb.ApplicationLoadBalancer("deploy-lb", {
	securityGroups: cluster.securityGroups,
});

const targetGroup = lb.createTargetGroup("deploy-lb-tg", {
	protocol: "HTTP",
	port: 3333,
	healthCheck: {
		protocol: "HTTP",
		path: "/health",
		interval: 10,
		healthyThreshold: 2,
		unhealthyThreshold: 10, // aumenta tolerância
		timeout: 5,
	},
});

const listener = lb.createListener("deploy-lb-listener", {
	protocol: "HTTP",
	port: 80,
	targetGroup,
});

// ============================================================================
// ECS FARGATE SERVICE (com variáveis de ambiente do RDS)
// ============================================================================
const app = new awsx.classic.ecs.FargateService("deploy-ecs-app", {
	cluster,
	desiredCount: 1,
	waitForSteadyState: false,
	taskDefinitionArgs: {
		container: {
			image: image.ref,
			cpu: 512,
			memory: 1024,
			portMappings: [listener],
			environment: [
				{ name: "NODE_ENV", value: "production" },
				{
					name: "DATABASE_URL",
					value: pulumi.interpolate`postgresql://postgres:${dbPassword}@${db.endpoint}/minhacidade_backend?sslmode=require`,
				},
				{ name: "PORT", value: "3333" },
				{ name: "JWT_SECRET", value: jwtSecret },
			],
			logConfiguration: {
				logDriver: "awslogs",
				options: {
					"awslogs-group": "/ecs/deploy-ecs-app",
					"awslogs-region": "us-east-1",
					"awslogs-stream-prefix": "app",
				},
			},
		},
	},
});

// ============================================================================
// AUTO SCALING
// ============================================================================
const scalingTarget = new aws.appautoscaling.Target("deploy-as-target", {
	minCapacity: 1,
	maxCapacity: 5,
	serviceNamespace: "ecs",
	scalableDimension: "ecs:service:DesiredCount",
	resourceId: pulumi.interpolate`service/${cluster.cluster.name}/${app.service.name}`,
});

new aws.appautoscaling.Policy("deploy-as-policy-cpu", {
	serviceNamespace: scalingTarget.serviceNamespace,
	scalableDimension: scalingTarget.scalableDimension,
	resourceId: scalingTarget.resourceId,
	policyType: "TargetTrackingScaling",
	targetTrackingScalingPolicyConfiguration: {
		predefinedMetricSpecification: {
			predefinedMetricType: "ECSServiceAverageCPUUtilization",
		},
		targetValue: 50,
	},
});

// ============================================================================
// EXPORTS
// ============================================================================
export const url = listener.endpoint.hostname;
export const databaseEndpoint = db.endpoint;
export const databaseName = db.dbName;
