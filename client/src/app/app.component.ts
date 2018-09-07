import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AwbService} from './services/awb.service';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  form: FormGroup;
  aSub: Subscription;
  generatedAwbData: any;


  constructor(private awbService: AwbService) {
  }

  ngOnInit() {
    this.form = new FormGroup({
      awbNr: new FormControl(null, [Validators.required]),
      length: new FormControl(null, null),
      width: new FormControl(null, null),
      height: new FormControl(null, null),
      product: new FormControl(null, [Validators.required]),
    })
  }

  generateAwb() {
    this.form.disable();
    this.aSub = this.awbService.generate(this.form.value)
      .subscribe(
        (data) => {
          console.log("Success");
          this.generatedAwbData = data;

          setTimeout(() => {
            this.form.enable();
          }, 1000);

        },
        error => {
          console.log(error);
          setTimeout(() => {
            this.form.enable();
          }, 2000);
        }
      )
  }

  // delay(ms: number) {
  //   return new Promise(resolve => setTimeout(resolve, ms));
  // }

  ngOnDestroy() {
    if (this.aSub) {
      this.aSub.unsubscribe();
    }
  }
}
