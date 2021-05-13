var moment = require('moment');
var fetch = require('node-fetch');
const delay = require('delay');
const notifier = require('node-notifier');
var nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const {
  EMAIL,
  REFRESH_TOKEN,
  CLIENT_SECRET,
  CLIENT_ID
} = require('./env');




const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: EMAIL,
      accessToken,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN
    }
  });

  return transporter;

};


const DISTRICTS = {
  PANCHKULA: 187,
  CHANDIGARH: 108,
 };

const reces =  {
  [DISTRICTS.PANCHKULA]: [
    'amritsingh183@gmail.com',
  ],
  [DISTRICTS.CHANDIGARH]: [
    'amritsingh183@gmail.com',
  ],
}

const centerIdFilter = {
  [DISTRICTS.PANCHKULA]: [13364, 1030],
  [DISTRICTS.CHANDIGARH]: []
}

const doMail = async ({mailOptions}) => {
  let emailTransporter = await createTransporter();
  return new Promise((resolve,reject)=>{
    emailTransporter.sendMail(mailOptions, function(error, info){
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  })
}

const sendMail = async (districtId, list)=> {
 const listHtml = list.map((slot)=> {
   let s = "<li>";
   s+=`${slot.state}, ${slot.district}, ${slot.centerName}, ${slot.date}, ${slot.available_capacity}`
   s+= "</li>";
   return s;
 })
 var mailOptions = {
   from: EMAIL,
   to: reces[districtId].push(EMAIL).join(','),
   subject: `${list.length} Cowin Slots Available`,
   html: `<h1> Slot List <h2> </br><ul>${listHtml.join('')}</ul>`,
 };
 try{ 
   await doMail({mailOptions})
 }
 catch(e) {
console.log(e);
 }
}



fetchSlotsForEachDistrictPerRange = async ({date,districtId,districtName}) => {
  const response = await fetch(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${date}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-GB,en;q=0.9,ar;q=0.8,es;q=0.7,es-419;q=0.6",
      "cache-control": "max-age=0",
      "if-none-match": "W/\"2224-sE2QQeYNqoX9NfpZ+U7LJq/uSMI\"",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
    },
    "method": "GET",
  });
 if(response.status === 200) {
   const data = await response.json();
   return data;
 }
}


const parseDataAndAccumulate = (districtId, data) => {
  let acc = []
  let centerList = null;
  if(centerIdFilter[districtId]) {
    centerList = centerIdFilter[districtId]
  }
  data.centers.filter(({ center_id}) => {
    if(centerList.length) {
      return centerList.indexOf(center_id) !== -1;
    }
    return true
  }).forEach((center)=>{
    const state = center.state_name;
    const district = center.district_name;
    const centerName = center.name;
      center.sessions.forEach((session)=> {
        if(session.min_age_limit < 45 && session.available_capacity > 1) {
          acc.push({
            state,
            district,
            centerName,
            date: session.date,
            available_capacity: session.available_capacity,
          })
        }
      })
  })
  return acc;
}


const printBookings = (acc) => {
  if(acc.length===0) {
  // console.log("NO SLOTS AVAILABLE");
  
  } else {
  acc.forEach((slots)=>{ 
    console.log(slots.state,slots.district, slots.centerName, slots.date, slots.available_capacity);

  })
  
  notifier.notify({
    title: 'Cowin Tracker',
    message: `${acc.length} SLOTS FOUND`,
  });
  }
}

const start = async ()=> {
  let rangeMoment = moment();
  for (let i = 0; i < 1; i++) {
      for(districtName in DISTRICTS) {
        let acc = [];
        const districtId = DISTRICTS[districtName];
        const data = await fetchSlotsForEachDistrictPerRange({date: rangeMoment.format('DD-MM-YYYY'),districtId, districtName});
        const timer = Math.random()*2;
        await delay(1000* Math.max(timer,1));

        
        try {
          acc = parseDataAndAccumulate(districtId, data);
        }
        catch(e) {
          console.log(e);
        }
        printBookings(acc);
        if (acc.length > 0) {
          await sendMail(districtId, acc);
          return true;
        }
      }
      rangeMoment.add(7,'days');
  }
  //  if(acc.length>0) {
  //  }
};

async function init() {
  let breaks = false;
  while(true) {
    console.log("Checked at - ", moment().format('MMMM Do YYYY, h:mm:ss a'));
    try {
      await start();
    } catch(e) {
      console.log(e)
    }
    const timer = 2000;
    await delay(timer);

  }
}

init();
