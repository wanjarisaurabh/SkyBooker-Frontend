import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


//decorator @ is used to tell that the below class is component
@Component({
  selector: 'app-root', // its custom html tag , <app-root></app-root>
  standalone: true, // this make component standalone पहले component को app.module.ts में declare करना पड़ता था।
  imports: [RouterOutlet], // this import router outlet for routing 
  templateUrl: './app.component.html' // this is the template for the component
})
export class AppComponent { }