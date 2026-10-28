import {IsIn, IsOptional} from "class-validator";


export class MonitorStatsQueryDto {
	@IsOptional()
	@IsIn(['1h', '24h', '7d'])
	period: '1h' | '24h' | '7d' = '24h';
}