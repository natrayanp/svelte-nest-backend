import { IsEmail } from 'class-validator';

export class useremaildto {
    @IsEmail()
    useremail: string;
}