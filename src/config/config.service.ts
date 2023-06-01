import { IConfigService } from "./config.interface";
import { DotenvParseOutput, config } from "dotenv";

config()

export class ConfigService implements IConfigService {
    private config: DotenvParseOutput;
    constructor() {
        const { error, parsed } = config();
        if (error) {
            throw new Error('ConfigService: Unable to parse .env file');
        }
        if (!parsed) {
            throw new Error('ConfigService: Empty .env file');
        }
        this.config = parsed;
    }
    get(key: string): string {
        const res = this.config[key];
        if (!res) {
            throw new Error(`ConfigService: ${key} not found in .env file`);
        }
        return res;
    }
}