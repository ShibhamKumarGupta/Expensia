import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  authForm!: FormGroup;
  isLoginMode = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]], 
      name: [''] 
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  
    const nameControl = this.authForm.get('name');
    if (!this.isLoginMode) {
      nameControl?.setValidators([Validators.required]);
    } else {
      nameControl?.clearValidators();
    }
    nameControl?.updateValueAndValidity();
  }
  
  
  onSubmit(): void {
    const { email, password, name } = this.authForm.value;
  
  if (!this.isLoginMode && password.length < 8) {
    alert('Password must be at least 8 characters long');
    return;
  }
   
    if (this.isLoginMode) {
      this.authService.login(email, password).then(() => {
        this.router.navigate(['/dashboard']);
      }).catch((error) => {
        console.error(error);
        alert('Incorrect email or password.');
      });
    } else {

      if (!name || name.trim() === '') {
      alert('Name is required for registration');
      return;
    }
      this.authService.register(email, password, name).then(() => {
        this.router.navigate(['/dashboard']);
      }).catch((error) => {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
          alert('This email is already registered. Please log in.');
        } else if (error.code === 'auth/invalid-email') {
          alert('Invalid email format.');
        } else {
          alert('Registration failed. Try again.');
        }
      });
    }
  }    
  
}
