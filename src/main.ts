import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from './environments/environment';
import { provideStorage, getStorage } from '@angular/fire/storage';
// Add these Font Awesome imports
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash, faDoorOpen } from '@fortawesome/free-solid-svg-icons'; // <-- NEW ICONS


// Initialize Font Awesome icons
function initializeFontAwesome(library: FaIconLibrary) {
  library.addIcons(
    faPen,       // Pencil/edit icon
    faTrash,     // Trash/delete icon
    faDoorOpen   // Logout/door-open icon
  );
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(
      ReactiveFormsModule,
      CommonModule,
      FontAwesomeModule,
      ReactiveFormsModule,
  CommonModule,
  FontAwesomeModule,
    ),
    // Register FaIconLibrary with icons
    {
      provide: FaIconLibrary,
      useFactory: () => {
        const library = new FaIconLibrary();
        initializeFontAwesome(library);
        return library;
      }
    },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
}).catch(err => console.error(err));