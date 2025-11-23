import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build";

// ============================================================================
// CONFIG
// ============================================================================
const config = new pulumi.Config();
const dbPassword = config.requireSecret("dbPassword");
const jwtSecret = config.requireSecret("jwtSecret");
const certificateArn = config.get("certificateArn"); // Optional - se vazio, usa apenas HTTP

// ============================================================================
// ECR + DOCKER IMAGE
// ============================================================================
const repository = new awsx.ecr.Repository("deploy-ecr-repo");

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
// VPC PADRÃO
// ============================================================================
const defaultVpc = pulumi.output(aws.ec2.getVpc({ default: true }));
const defaultSubnets = defaultVpc.apply((vpc) =>
	aws.ec2.getSubnets({
		filters: [{ name: "vpc-id", values: [vpc.id] }],
	}),
);

// ============================================================================
// RDS POSTGRES
// ============================================================================
const dbSubnetGroup = new aws.rds.SubnetGroup("deploy-db-subnet", {
	subnetIds: defaultSubnets.apply((s) => s.ids),
});

const dbSecurityGroup = new aws.ec2.SecurityGroup("deploy-db-sg", {
	vpcId: defaultVpc.apply((v) => v.id),
	ingress: [
		{
			protocol: "tcp",
			fromPort: 5432,
			toPort: 5432,
			cidrBlocks: ["0.0.0.0/0"],
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
	publiclyAccessible: true,
	skipFinalSnapshot: true,
	backupRetentionPeriod: 0,
});

// ============================================================================
// ECS CLUSTER
// ============================================================================
const cluster = new awsx.classic.ecs.Cluster("deploy-ecs-cluster");

// ============================================================================
// SECURITY GROUP DO ALB (MANUAL)
// ============================================================================
const lbSecurityGroupIngress = [
	{
		protocol: "tcp",
		fromPort: 80,
		toPort: 80,
		cidrBlocks: ["0.0.0.0/0"],
	},
];

// Adiciona regra HTTPS apenas se houver certificado
if (certificateArn) {
	lbSecurityGroupIngress.push({
		protocol: "tcp",
		fromPort: 443,
		toPort: 443,
		cidrBlocks: ["0.0.0.0/0"],
	});
}

const lbSecurityGroup = new aws.ec2.SecurityGroup("deploy-lb-sg", {
	vpcId: defaultVpc.apply((v) => v.id),
	ingress: lbSecurityGroupIngress,
	egress: [
		{
			protocol: "-1",
			fromPort: 0,
			toPort: 0,
			cidrBlocks: ["0.0.0.0/0"],
		},
	],
});

// ============================================================================
// LOAD BALANCER
// ============================================================================
const lb = new awsx.classic.lb.ApplicationLoadBalancer("deploy-lb", {
	securityGroups: [lbSecurityGroup.id],
});

// ============================================================================
// TARGET GROUP (porta interna 3333)
// ============================================================================
const tg = lb.createTargetGroup("deploy-lb-tg", {
	protocol: "HTTP",
	port: 3333,
	targetType: "ip",
	healthCheck: {
		protocol: "HTTP",
		path: "/health",
		interval: 10,
		healthyThreshold: 3,
		unhealthyThreshold: 3,
		timeout: 5,
	},
});

// ============================================================================
// LISTENERS (HTTP e opcionalmente HTTPS)
// ============================================================================
let httpListener: any;

if (certificateArn) {
	// Se tem certificado: HTTP redireciona para HTTPS
	httpListener = lb.createListener("deploy-lb-http", {
		protocol: "HTTP",
		port: 80,
		defaultActions: [
			{
				type: "redirect",
				redirect: {
					protocol: "HTTPS",
					port: "443",
					statusCode: "HTTP_301",
				},
			},
		],
	});

	// Listener HTTPS principal
	const httpsListener = lb.createListener("deploy-lb-https", {
		protocol: "HTTPS",
		port: 443,
		certificateArn: certificateArn,
		sslPolicy: "ELBSecurityPolicy-2016-08",
		targetGroup: tg,
	});
} else {
	// Sem certificado: HTTP direto para o target group
	httpListener = lb.createListener("deploy-lb-http", {
		protocol: "HTTP",
		port: 80,
		targetGroup: tg,
	});
}

// ============================================================================
// CLOUDWATCH LOGS
// ============================================================================
const logGroup = new aws.cloudwatch.LogGroup("deploy-ecs-logs", {
	name: "/ecs/deploy-ecs-app",
	retentionInDays: 7,
});

// ============================================================================
// ECS SERVICE (portMappings manuais)
// ============================================================================
const app = new awsx.classic.ecs.FargateService("deploy-ecs-app", {
	cluster,
	desiredCount: 1,
	waitForSteadyState: false,

	taskDefinitionArgs: {
		container: {
			image: image.ref,
			cpu: 256,
			memory: 512,

			// ✅ USAR O LISTENER PARA CONECTAR AO LOAD BALANCER
			portMappings: [httpListener],

			environment: [
				{ name: "NODE_ENV", value: "production" },
				{
					name: "DATABASE_URL",
					value: pulumi.interpolate`postgresql://postgres:${dbPassword}@${db.endpoint}/minhacidade_backend`,
				},
				{ name: "JWT_SECRET", value: jwtSecret },
				{ name: "PORT", value: "3333" },
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
// CLOUD FRONT (com protocolo adaptativo)
// ============================================================================
const cfDistribution = new aws.cloudfront.Distribution("deploy-cf-distro", {
	enabled: true,
	isIpv6Enabled: true,

	origins: [
		{
			domainName: lb.loadBalancer.dnsName,
			originId: "alb",
			customOriginConfig: {
				httpPort: 80,
				httpsPort: 443,
				// CloudFront sempre usa HTTP para falar com ALB (interno)
				// Mas serve HTTPS para o usuário (viewerProtocolPolicy abaixo)
				originProtocolPolicy: "http-only",
				originSslProtocols: ["TLSv1.2"],
			},
		},
	],

	defaultCacheBehavior: {
		allowedMethods: [
			"GET",
			"HEAD",
			"OPTIONS",
			"PUT",
			"POST",
			"PATCH",
			"DELETE",
		],
		cachedMethods: ["GET", "HEAD"],
		targetOriginId: "alb",
		forwardedValues: {
			queryString: true,
			headers: ["*"],
			cookies: { forward: "all" },
		},
		// CloudFront sempre serve HTTPS para o usuário final
		viewerProtocolPolicy: "redirect-to-https",
		minTtl: 0,
		defaultTtl: 0,
		maxTtl: 0,
	},

	restrictions: {
		geoRestriction: {
			restrictionType: "none",
		},
	},

	viewerCertificate: {
		cloudfrontDefaultCertificate: true,
	},
});

// ============================================================================
// EXPORTS
// ============================================================================
export const albUrl = pulumi.interpolate`https://${lb.loadBalancer.dnsName}`;
export const cloudFrontUrl = pulumi.interpolate`https://${cfDistribution.domainName}`;
export const databaseEndpoint = db.endpoint;
export const databaseName = db.dbName;
