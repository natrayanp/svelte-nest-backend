import { Routes } from "nest-router";
import { AuthModule } from "./modules/feature/auth/auth.module";

export const routes: Routes = [
    {
      path: '/auth',
      module: AuthModule,
      children: [
      ],
    },
  ];