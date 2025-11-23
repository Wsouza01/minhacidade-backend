#!/bin/bash
# Script para obter URL do CloudFront do Pulumi
cd "$(dirname "$0")"
pulumi stack output cloudFrontUrl 2>/dev/null | tr -d '\n'
