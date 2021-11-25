#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { FinanceDashStack } from '../lib/finance-dash-stack';

const app = new cdk.App();
new FinanceDashStack(app, 'FinanceDashStack');
