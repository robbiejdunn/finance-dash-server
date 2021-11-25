#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const finance_dash_server_stack_1 = require("../lib/finance-dash-server-stack");
const app = new cdk.App();
new finance_dash_server_stack_1.FinanceDashServerStack(app, 'FinanceDashServerStack');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluYW5jZS1kYXNoLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpbmFuY2UtZGFzaC1zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscUNBQXFDO0FBQ3JDLGdGQUEwRTtBQUUxRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixJQUFJLGtEQUFzQixDQUFDLEdBQUcsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgRmluYW5jZURhc2hTZXJ2ZXJTdGFjayB9IGZyb20gJy4uL2xpYi9maW5hbmNlLWRhc2gtc2VydmVyLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBGaW5hbmNlRGFzaFNlcnZlclN0YWNrKGFwcCwgJ0ZpbmFuY2VEYXNoU2VydmVyU3RhY2snKTtcbiJdfQ==