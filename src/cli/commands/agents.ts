import { Command } from 'commander'
import { listPersonas } from '../../personas/loader.js'

export const agentsCommand = new Command('agents')
    .description('List available agents')
    .option('--list', 'Show all available agents')
    .action(async () => {
        await listPersonas()
    })