#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { FinanceDashServerStack } from '../lib/finance-dash-server-stack';

const app = new cdk.App();
new FinanceDashServerStack(app, 'FinanceDashServerStack');
