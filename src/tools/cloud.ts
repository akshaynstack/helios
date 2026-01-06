/**
 * Docker & Cloud Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { safeExec, writeFile } from './utils.js';

export const tools: Tool[] = [
    { name: 'docker_build', description: 'Build Docker image', parameters: { type: 'object', properties: { tag: { type: 'string', description: 'Image tag' }, dockerfile: { type: 'string', description: 'Dockerfile path' } }, required: ['tag'] } },
    { name: 'docker_run', description: 'Run Docker container', parameters: { type: 'object', properties: { image: { type: 'string', description: 'Image name' }, port: { type: 'string', description: 'Port mapping' }, env: { type: 'string', description: 'Env vars (JSON)' } }, required: ['image'] } },
    { name: 'docker_compose_up', description: 'Start Docker Compose services', parameters: { type: 'object', properties: { detach: { type: 'string', description: 'Run in background' } }, required: [] } },
    { name: 'docker_compose_down', description: 'Stop Docker Compose services', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'docker_ps', description: 'List running containers', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'docker_logs', description: 'View container logs', parameters: { type: 'object', properties: { container: { type: 'string', description: 'Container name/ID' }, tail: { type: 'string', description: 'Lines' } }, required: ['container'] } },
    { name: 'vercel_deploy', description: 'Deploy to Vercel', parameters: { type: 'object', properties: { prod: { type: 'string', description: 'Production' } }, required: [] } },
    { name: 'railway_deploy', description: 'Deploy to Railway', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'fly_deploy', description: 'Deploy to Fly.io', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'create_dockerfile', description: 'Create Dockerfile for project', parameters: { type: 'object', properties: { type: { type: 'string', description: 'node, python, go' }, port: { type: 'string', description: 'Port' } }, required: ['type'] } }
];

export const handlers: Record<string, ToolHandler> = {
    docker_build: (args) => safeExec(`docker build -t ${args.tag} -f ${args.dockerfile || 'Dockerfile'} .`),
    docker_run: (args) => {
        const port = args.port ? `-p ${args.port}` : '';
        const env = args.env ? Object.entries(JSON.parse(args.env)).map(([k, v]) => `-e ${k}=${v}`).join(' ') : '';
        return safeExec(`docker run -d ${port} ${env} ${args.image}`);
    },
    docker_compose_up: (args) => safeExec(`docker-compose up ${args.detach === 'true' ? '-d' : ''}`),
    docker_compose_down: () => safeExec('docker-compose down'),
    docker_ps: () => safeExec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'),
    docker_logs: (args) => safeExec(`docker logs --tail ${args.tail || 50} ${args.container}`),
    vercel_deploy: (args) => safeExec(`vercel ${args.prod === 'true' ? '--prod' : ''}`),
    railway_deploy: () => safeExec('railway up'),
    fly_deploy: () => safeExec('fly deploy'),
    create_dockerfile: (args) => {
        const templates: Record<string, string> = {
            node: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nEXPOSE ${args.port || 3000}\nCMD ["node", "dist/index.js"]`,
            python: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE ${args.port || 8000}\nCMD ["python", "main.py"]`,
            go: `FROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\nFROM alpine:latest\nCOPY --from=builder /app/main /main\nEXPOSE ${args.port || 8080}\nCMD ["/main"]`
        };
        return writeFile('Dockerfile', templates[args.type] || templates.node);
    }
};
