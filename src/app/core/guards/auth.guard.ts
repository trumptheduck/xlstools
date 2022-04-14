import { Injectable } from "@angular/core";
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
    UrlTree
} from "@angular/router";
import { GoogleConvertService } from "../services/convert.service";
  
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private gC$: GoogleConvertService,
        private router: Router) { }
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean | Promise<boolean> {
        var isAuthenticated = this.gC$.isSignedIn;
        if (!isAuthenticated) {
            this.router.navigate(['auth']);
        }
        return isAuthenticated;
    }
}