import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: '<p>Procesando inicio de sesión...</p>' // Mensaje temporal mientras redirige
})
export class LoginSuccess implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    const token = params['token'];
    const userStr = params['user'];

    if (token && userStr) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userStr);

      this.router.navigate(['/']); 
      
    } else {
      this.router.navigate(['/login']);
    }
  });
  }
}