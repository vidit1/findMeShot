### FIND ME SHOT 

How to use:

Before start need to install all the dependencies 
run - ```npm i```

Create an env file which looks something like this
```
const EMAIL= ''
const REFRESH_TOKEN=''
const CLIENT_SECRET=''
const CLIENT_ID=''

const env =  {
  EMAIL,
  REFRESH_TOKEN,
  CLIENT_SECRET,
  CLIENT_ID,
};
return env;
```
Use google console to get all the tokens and secrets

How to configure and help friends
```
const DISTRICTS = {
  PANCHKULA: 187,
  CHANDIGARH: 108,
 };

const reces =  {
  [DISTRICTS.PANCHKULA]: [
    'valid email',
  ],
  [DISTRICTS.CHANDIGARH]: [
    'valid email 2',
  ],
}
const centerIdFilter = {
  [DISTRICTS.PANCHKULA]: [13364, 1030],
  [DISTRICTS.CHANDIGARH]: []
}
````


running the code
```node index.js```

polling time is set to 2 secs at the moment. If the api is starts failing stop the service because your IP is blocked for few minutes and you can resumt again
