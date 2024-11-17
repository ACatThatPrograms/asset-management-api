import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddAssetDto {
    @IsString()
    @ApiProperty({ description: 'A description of the asset', example: 'Test Asset' })
    tokenDescription?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The type of the asset', example: 'ERC-20' })
    assetType: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The smart contract address of the asset', example: '0x123...' })
    smartContractAddress: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ description: 'The quantity of the asset', example: 100, required: false })
    quantity?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The token ID (if applicable)', example: '1234', required: false })
    tokenId?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ description: 'The cost basis for the asset', example: 50.5 })
    costBasis?: number;
}
