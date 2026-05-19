import { HttpContextToken } from '@angular/common/http';

//http context token
//it is used to pass the token to the http request
//it is a global token that can be accessed by all the components
//it is a boolean token that can be true or false
//if true, it will skip the auth interceptor
//if false, it will not skip the auth interceptor

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
//created to tell don't atached the token with Api request , flase is default 


//does not use with login and register neeed to set true their but we haven't use it , because wee don't have token in that time 
//to atched 