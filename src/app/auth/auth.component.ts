import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleConvertService } from '../core/services/convert.service';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  constructor(
    private gConvert$: GoogleConvertService,
    private router: Router,
    private ngZone: NgZone
    ) { }

  ngOnInit(): void {
  }

  signIn() {
    this.gConvert$.signIn(()=>{
      this.ngZone.run(()=>{this.router.navigate([""])});
    });
  }

}
