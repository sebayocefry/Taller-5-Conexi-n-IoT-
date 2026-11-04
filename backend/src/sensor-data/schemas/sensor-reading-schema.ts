import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import type {HydratedDocument} from 'mongoose';


export type SensorReadingDocument = HydratedDocument<SensorReading>;

@Schema({collection:'sensor_readings'})
export class SensorReading{
    @Prop({required:true,trim:true})
    deviceId!: string;
    @Prop({required:true})
    temperatura:number
    @Prop({required:true, min:0,max:100})
    humedad:number
    @Prop({required:true,min:0,max:4})
    nivelAgua:number
    @Prop({type:Date,default:Date.now})
    receivedAt!: Date;
};

export const SensorReadingSchema= SchemaFactory.createForClass(SensorReading);

SensorReadingSchema.index({deviceId:1,receivedAt:-1});