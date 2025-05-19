import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';


export const routes: Routes = [
  { path: 'login', component: AuthComponent }, 
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { path: 'dashboard', component: DashboardComponent }, 
  { path: '**', redirectTo: 'login' }  
];
