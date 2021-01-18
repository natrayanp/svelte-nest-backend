import { IsEmail } from 'class-validator';

export class useremaildto {
    @IsEmail()
    useremail: string;
}


export class domainregisdto {
    siteid: string;
    registype: string;
}