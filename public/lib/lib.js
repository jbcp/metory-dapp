function tab3_example(){
    document.getElementsByName("SubjectId")[0].value="JBNU_Subject01"
    document.getElementsByName("ConsentId")[0].value= "C_A70_07EQT1930P"
    document.getElementsByName("ConsentVersion")[0].value="1.0"
    document.getElementsByName("StudyId")[0].value="A70_07EQT1930P"
    document.getElementsByName("HospitalId")[0].value="JBUN"
    document.getElementsByName("SponsorId")[0].value="Yuhan"
    document.getElementsByName("SubjectConsentExplanationRequestTime")[0].value=getTimeStamp()
    document.getElementsByName("SubjectConsentSignTime")[0].value=getTimeStamp()
    document.getElementsByName("LegalRepresentativeId")[0].value=""
    document.getElementsByName("LegalRepresentativeConsentExplantionRequestTime")[0].value=""
    document.getElementsByName("LegalRepresentativeConsentSignTime")[0].value=""
    document.getElementsByName("InvestigatorId")[0].value="mgkim"
    document.getElementsByName("InvestigatorConsentExplanationConfirmTime")[0].value=getTimeStamp()
    document.getElementsByName("InvestigatorConsentSignTime")[0].value=getTimeStamp()
    document.getElementsByName("Status")[0].value="signed"
    var origin = document.getElementsByName("StudyId")[0].value + document.getElementsByName("ConsentId")[0].value + document.getElementsByName("ConsentVersion")[0].value
    console.log(origin);
    document.getElementsByName("ConsentHash")[0].value=CryptoJS.SHA1(origin)
}


function tab4_getSubjectInfo(){
    var subject_id = document.getElementsByName("subject_code")[0].value
    console.log(subject_id)
    a_url = "/api/consent/subject/"+subject_id

    console.log(a_url)
     $.ajax({
        url: a_url,
        success: function(data) {
            console.log({data:data})
            data = data.message
            if(data.consent_id==undefined)
                data.consent_id=""
            if(data.subject_id==undefined)
                data.subject_id=""
            if(data.consent==undefined)
                data.consent=""
            if(data.study_id==undefined)
                data.study_id=""
            if(data.hospital_id==undefined)
                data.hospital_id=""
            if(data.sponser_id==undefined)
                data.sponser_id=""
            if(data.subject_consent_explanation_request_time==undefined)
                data.subject_consent_explanation_request_time=""
            if(data.subject_consent_sign_time==undefined)
                data.subject_consent_sign_time=""
            if(data.legal_representative_id==undefined)
                data.legal_representative_id=""
            if(data.legal_representative_consent_explantion_request_time==undefined)
                data.legal_representative_consent_explantion_request_time=""
            if(data.legal_representative_consent_sign_time==undefined)
                data.legal_representative_consent_sign_time=""
            if(data.investigator_id==undefined)
                data.investigator_id=""
            if(data.investigator_consent_explanation_confirm_time==undefined)
                data.investigator_consent_explanation_confirm_time=""
            if(data.investigator_consent_sign_time==undefined)
                data.investigator_consent_sign_time=""
            if(data.status==undefined)
                data.status=""
            if(data.consent_hash==undefined)
                data.consent_hash=""
	    if(data.consent_version==undefined)
		data.consent_version=""
	    if(data.hispital_id==undefined)
		data.hispital_id=""
	    if(data.sponsor_id==undefined)
		data.sponsor_id=""	


            document.getElementsByName("SubjectId_update")[0].value=data.subject_id
            document.getElementsByName("ConsentId_update")[0].value=data.consent_id
            document.getElementsByName("ConsentVersion_update")[0].value=data.consent_version
            document.getElementsByName("StudyId_update")[0].value=data.study_id
            document.getElementsByName("HospitalId_update")[0].value=data.hispital_id
            document.getElementsByName("SponsorId_update")[0].value=data.sponsor_id
            document.getElementsByName("SubjectConsentExplanationRequestTime_update")[0].value=data.subject_consent_explanation_request_time
            document.getElementsByName("SubjectConsentSignTime_update")[0].value=data.subject_consent_sign_time
            document.getElementsByName("LegalRepresentativeId_update")[0].value=data.legal_representative_id
            document.getElementsByName("LegalRepresentativeConsentExplantionRequestTime_update")[0].value=data.legal_representative_consent_explantion_request_time
            document.getElementsByName("LegalRepresentativeConsentSignTime_update")[0].value=data.legal_representative_consent_sign_time
            document.getElementsByName("InvestigatorId_update")[0].value=data.investigator_id
            document.getElementsByName("InvestigatorConsentExplanationConfirmTime_update")[0].value=data.investigator_consent_explanation_confirm_time
            document.getElementsByName("InvestigatorConsentSignTime_update")[0].value=data.investigator_consent_sign_time
            document.getElementsByName("Status_update")[0].value=data.status
            document.getElementsByName("ConsentHash_update")[0].value=data.consent_hash

          
        },
      })

 
}
async function tab5_getblock(){

    a_url = "/api/block"
    var result =""
    console.log(a_url)
     await $.ajax({
        url: a_url,
        success: function(data) {
        console.log(data)
          result = data
        },
      })

      result = result.returnBlockchain
      document.getElementById("block_result").innerHTML=''

      for(i=result.length-1;i>=0;i--){
         var newBlock  = document.createElement("div")
         newBlock.setAttribute("class","card")

         var header = document.createElement("div")
         header.setAttribute("class","card-header")
         header.innerHTML = `<h4> Block #${i} </h4> <hr>`

         var body = document.createElement("div")
         body.setAttribute("class","card-body")
         
         var pre = document.createElement("pre")
         pre.innerText = JSON.stringify(result[i], null, 3)


         //합치기
         body.appendChild(pre);
         newBlock.appendChild(header);
         newBlock.appendChild(body);

         document.getElementById("block_result").appendChild(newBlock);
      }
      
      return result;

 
}


function getTimeStamp() {
    var d = new Date();
    var s =
      leadingZeros(d.getFullYear(), 4) + '-' +
      leadingZeros(d.getMonth() + 1, 2) + '-' +
      leadingZeros(d.getDate(), 2) + ' ' +
  
      leadingZeros(d.getHours(), 2) + ':' +
      leadingZeros(d.getMinutes(), 2) + ':' +
      leadingZeros(d.getSeconds(), 2);
  
    return s;
  }
  
function leadingZeros(n, digits) {
var zero = '';
n = n.toString();

if (n.length < digits) {
    for (i = 0; i < digits - n.length; i++)
    zero += '0';
}
return zero + n;
}
  
