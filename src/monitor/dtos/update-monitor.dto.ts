import {IsInt, IsOptional, IsString, Max, Min} from "class-validator";

export class UpdateMonitorDto {
	@IsString()
	@IsOptional()
	name: string;
	@IsInt()
	@IsOptional()
	@Min(5)
	intervalSeconds: number;
	@IsInt()
	@IsOptional()
	@Max(600)
	timeoutSeconds: number;
}