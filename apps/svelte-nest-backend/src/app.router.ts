import { Routes } from "nest-router";
import { AuthModule } from "./modules/feature/auth/auth.module";
import { EntityModule } from "./modules/feature/entity/entity.module";

export const routes: Routes = [
    {
      path: '/auth',
      module: AuthModule,
      children: [
      ]  
    },
    {
      path: '/entity',
      module: EntityModule,
      children: [
      ],
    }
  ];