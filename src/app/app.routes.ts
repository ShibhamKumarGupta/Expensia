import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';


export const routes: Routes = [
  { path: 'login', component: AuthComponent },  // Login/Signup page
  { 
    path: '', 
    redirectTo: 'login',  // Auto-redirect root path to /login
    pathMatch: 'full' 
  },
  { path: 'dashboard', component: DashboardComponent },  // Protected later
  { path: '**', redirectTo: 'login' }  // Fallback to login (e.g., 404)
];
