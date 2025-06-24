# ACDC Issuance with KLI: Not-Issuer-To-Issuee

<b>🎯 OBJECTIVE</b><hr>
Demonstrate how to issue an ACDC that utilizes a Not-Issuer-To-Issuee (NI2I) edge, illustrating how to reference another credential for context without implying the issuer is the issuee of the linked ACDC. This notebook will also show how a rule can be embedded in the credential. We will implement the **"Linking to an External Training Course"** scenario.
</div>


## Scenario Recap: Linking to an External Training Course

This notebook focuses on the practical KLI commands for implementing an `NI2I` chained credentials. For a detailed theoretical explanation of ACDC Edges, Edge Operators, and Rules, please refer to the **[Advanced ACDC Features: Edges, Edge Operators, and Rules](101_75_ACDC_Edges_and_Rules.ipynb)** notebook. To summarize the scenario:

- A Company issues a **"Skill Certified"** ACDC to an employee, after the employee completes an internal assessment.
- To add verifiable, supporting context to this certification, the "Skill Certified" ACDC can contain an `NI2I` (Not-Issuer-To-Issuee) edge. This edge would point to a "Course Completion" ACDC that the employee had previously received from an external, third-party Training Provider.
- This `NI2I` link signifies that while the external training is acknowledged as relevant evidence, the Company's authority to issue its own skill certification is independent and does not derive from the Training Provider's credential.
- The "Employee Skill Certified" ACDC will also include a simple rule in its `r` section.

## Initial Setup: Keystores, AIDs, Registries, and OOBIs

We begin by setting up the three participants in our scenario:

- Training Provider (`training_provider_aid`): The entity issuing the course credential.
- Company (`company_aid`): The entity issuing the skill credential that references the first.
- Employee (`employee_aid`): The entity who is the subject (issuee) of both credentials.

For each participant, we will:
- Initialize a KERI keystore.
- Incept an AID, using a default witness configuration.
- Establish OOBI connections between the necessary parties (Training Provider ➡️ Employee, and Company ➡️ Employee) to enable secure communication.
- For the two issuers (Training Provider and Company), we will also incept a credential registry to manage the lifecycle of the credentials they issue.


```python
# Imports and Utility functions
from scripts.utils import exec, clear_keri, pr_title, pr_message, pr_continue
from scripts.saidify import get_schema_said
import json, os

clear_keri()

# Training Provider Keystore and AID
training_provider_keystore_name = "training_provider_ks"
training_provider_salt = exec("kli salt")
training_provider_aid_alias = "training_provider"
training_provider_registry_name = "training_provider_reg"

# Company Keystore and AID
company_keystore_name = "company_ks"
company_salt = exec("kli salt")
company_aid_alias = "company"
company_registry_name = "company_skill_reg"

# Employee Keystore and AID
employee_keystore_name = "employee_ks"
employee_salt = exec("kli salt")
employee_aid_alias = "employee"

pr_title("Initializing keystores")

!kli init --name {training_provider_keystore_name} \
    --nopasscode \
    --salt {training_provider_salt} \
    --config-dir ./config \
    --config-file keystore_init_config.json

!kli init --name {company_keystore_name} \
    --nopasscode \
    --salt {company_salt} \
    --config-dir ./config \
    --config-file keystore_init_config.json

!kli init --name {employee_keystore_name} \
    --nopasscode \
    --salt {employee_salt} \
    --config-dir ./config \
    --config-file keystore_init_config.json

pr_title("Initializing AIDs")

!kli incept --name {training_provider_keystore_name} \
    --alias {training_provider_aid_alias} \
    --file ./config/aid_inception_config.json

!kli incept --name {company_keystore_name} \
    --alias {company_aid_alias} \
    --file ./config/aid_inception_config.json

!kli incept --name {employee_keystore_name} \
    --alias {employee_aid_alias} \
    --file ./config/aid_inception_config.json

pr_title("Initializing Credential Registries")

!kli vc registry incept --name {training_provider_keystore_name} \
    --alias {training_provider_aid_alias} \
    --registry-name {training_provider_registry_name}

!kli vc registry incept --name {company_keystore_name} \
    --alias {company_aid_alias} \
    --registry-name {company_registry_name}

training_provider_aid_prefix = exec(f"kli aid --name {training_provider_keystore_name} --alias {training_provider_aid_alias}")
company_aid_prefix = exec(f"kli aid --name {company_keystore_name} --alias {company_aid_alias}")
employee_aid_prefix = exec(f"kli aid --name {employee_keystore_name} --alias {employee_aid_alias}")

pr_message(f"Training Provider AID: {training_provider_aid_prefix}")
pr_message(f"Company AID: {company_aid_prefix}")
pr_message(f"Employee AID: {employee_aid_prefix}")

pr_title("Generating and resolving OOBIs")

# Training Provider and Employee OOBI Exchange
training_provider_oobi = exec(f"kli oobi generate --name {training_provider_keystore_name} --alias {training_provider_aid_alias} --role witness")
employee_oobi = exec(f"kli oobi generate --name {employee_keystore_name} --alias {employee_aid_alias} --role witness")
company_oobi = exec(f"kli oobi generate --name {company_keystore_name} --alias {company_aid_alias} --role witness")

!kli oobi resolve --name {training_provider_keystore_name} \
    --oobi-alias {employee_aid_alias} \
    --oobi {employee_oobi}
           
!kli oobi resolve --name {employee_keystore_name} \
    --oobi-alias {training_provider_aid_alias} \
    --oobi {training_provider_oobi}

# Company and Employee OOBI Exchange

!kli oobi resolve --name {company_keystore_name} \
    --oobi-alias {employee_aid_alias} \
    --oobi {employee_oobi}

!kli oobi resolve --name {employee_keystore_name} \
    --oobi-alias {company_aid_alias} \
    --oobi {company_oobi}

# Company and Training Provider -----------------------------------
!kli oobi resolve --name {company_keystore_name} \
    --oobi-alias {training_provider_aid_alias} \
    --oobi {training_provider_oobi}

!kli oobi resolve --name {training_provider_keystore_name} \
    --oobi-alias {company_aid_alias} \
    --oobi {company_oobi}

pr_message("OOBI connections established.")
pr_continue()
```

    Proceeding with deletion of '/usr/local/var/keri/' without confirmation.
    ✅ Successfully removed: /usr/local/var/keri/
    
    [1m[4m[44m[90m  Initializing keystores  [0m
    
    KERI Keystore created at: /usr/local/var/keri/ks/training_provider_ks
    KERI Database created at: /usr/local/var/keri/db/training_provider_ks
    KERI Credential Store created at: /usr/local/var/keri/reg/training_provider_ks
    
    Loading 3 OOBIs...
    http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?name=Wan&tag=witness succeeded
    http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?name=Wes&tag=witness succeeded
    http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?name=Wil&tag=witness succeeded
    KERI Keystore created at: /usr/local/var/keri/ks/company_ks
    KERI Database created at: /usr/local/var/keri/db/company_ks
    KERI Credential Store created at: /usr/local/var/keri/reg/company_ks
    
    Loading 3 OOBIs...
    http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?name=Wan&tag=witness succeeded
    http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?name=Wes&tag=witness succeeded
    http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?name=Wil&tag=witness succeeded
    KERI Keystore created at: /usr/local/var/keri/ks/employee_ks
    KERI Database created at: /usr/local/var/keri/db/employee_ks
    KERI Credential Store created at: /usr/local/var/keri/reg/employee_ks
    
    Loading 3 OOBIs...
    http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?name=Wan&tag=witness succeeded
    http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?name=Wes&tag=witness succeeded
    http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?name=Wil&tag=witness succeeded
    
    [1m[4m[44m[90m  Initializing AIDs  [0m
    
    Waiting for witness receipts...
    Prefix  EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk
    	Public key 1:  DBiBnSAY0c77CS7c9o4BA_m2_alItNXU7qNIb6vkZ6dk
    
    Waiting for witness receipts...
    Prefix  EPpmDTQVjjRSKPmuhWXVFYXTNSGh77eU8aK3M2aZ7v5b
    	Public key 1:  DBP01fTRQwbV-k1Jyq4eNv8kSxLEK9qjK6M9N7aaCnXD
    
    Waiting for witness receipts...
    Prefix  EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u
    	Public key 1:  DL_ROtcHdyiyWR_DhYl4CRIl71rk8dssEfssqIhg8zY6
    
    
    [1m[4m[44m[90m  Initializing Credential Registries  [0m
    
    Waiting for TEL event witness receipts
    Sending TEL events to witnesses
    Registry:  training_provider_reg(EPFig-G01GQwfcR3T19tpnHYvi76qIcv1i5bxF7BDyvX) 
    	created for Identifier Prefix:  EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk
    Waiting for TEL event witness receipts
    Sending TEL events to witnesses
    Registry:  company_skill_reg(EBOYEMyb4K-vE-f-OYZ6wOlTICeZBS5O5M_byRQSSenT) 
    	created for Identifier Prefix:  EPpmDTQVjjRSKPmuhWXVFYXTNSGh77eU8aK3M2aZ7v5b
    
    [1m[94mTraining Provider AID: EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk[0m
    
    
    [1m[94mCompany AID: EPpmDTQVjjRSKPmuhWXVFYXTNSGh77eU8aK3M2aZ7v5b[0m
    
    
    [1m[94mEmployee AID: EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u[0m
    
    
    [1m[4m[44m[90m  Generating and resolving OOBIs  [0m
    
    http://witness-demo:5642/oobi/EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u/witness resolved
    http://witness-demo:5642/oobi/EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk/witness resolved
    http://witness-demo:5642/oobi/EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u/witness resolved
    http://witness-demo:5642/oobi/EPpmDTQVjjRSKPmuhWXVFYXTNSGh77eU8aK3M2aZ7v5b/witness resolved
    http://witness-demo:5642/oobi/EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk/witness resolved
    http://witness-demo:5642/oobi/EPpmDTQVjjRSKPmuhWXVFYXTNSGh77eU8aK3M2aZ7v5b/witness resolved
    
    [1m[94mOOBI connections established.[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## Schema Definitions

For this scenario, we require two distinct ACDC schemas:
- **Course Completion Schema** (' course_completion_schema.json' ): Defines the credential issued by the Training Provider.
- **Employee Skill Schema** (' employee_skill_schema.json'): Defines the credential issued by the Company, which will include the `NI2I` edge and a rule.

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
For this notebook, the schemas have been pre-SAIDified and are available on our mock schema server. The process of SAIDifying schemas was detailed in a previous notebook.
</div>

### Course Completion Schema

This schema defines a basic credential for certifying the completion of a training course. It's a standard, non-chained credential.

Filename: `course_completion_schema.json`


```python
course_schema_path = "config/schemas/course_completion_schema.json"
pr_title(f"Schema: {course_schema_path}")

course_schema_said = get_schema_said(course_schema_path)
pr_message(f"Schema SAID: {course_schema_said}")

pr_message(f"Retrieving Schema from Server:")
!curl -s http://vlei-server:7723/oobi/{course_schema_said} | jq

pr_continue()
```

    
    [1m[4m[44m[90m  Schema: config/schemas/course_completion_schema.json  [0m
    
    
    [1m[94mSchema SAID: EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS[0m
    
    
    [1m[94mRetrieving Schema from Server:[0m
    
    [1;39m{
      [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS"[0m[1;39m,
      [0m[34;1m"$schema"[0m[1;39m: [0m[0;32m"http://json-schema.org/draft-07/schema#"[0m[1;39m,
      [0m[34;1m"title"[0m[1;39m: [0m[0;32m"CourseCompletionCredential"[0m[1;39m,
      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential signifying the successful completion of a training course."[0m[1;39m,
      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
      [0m[34;1m"credentialType"[0m[1;39m: [0m[0;32m"CourseCompletionCredential"[0m[1;39m,
      [0m[34;1m"version"[0m[1;39m: [0m[0;32m"1.0.0"[0m[1;39m,
      [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
        [0m[34;1m"v"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential Version String"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"u"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"One time use nonce"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"i"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuer AID (Training Provider's AID)"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"ri"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Registry SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"s"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Schema SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"a"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"oneOf"[0m[1;39m: [0m[1;39m[
            [1;39m{
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes block SAID"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
            [1;39m}[0m[1;39m,
            [1;39m{
              [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"EAZBHKYO89jH2XDisldRbTvkxJLPG-BQZngGYnp-MhaG"[0m[1;39m,
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes block"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
              [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes data SAID"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"i"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuee AID (Employee's AID)"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"dt"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuance date time"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                  [0m[34;1m"format"[0m[1;39m: [0m[0;32m"date-time"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"courseName"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The name of the completed course."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"courseLevel"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The level of the course."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"completionDate"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The date the course was completed."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                  [0m[34;1m"format"[0m[1;39m: [0m[0;32m"date"[0m[1;39m
                [1;39m}[0m[1;39m
              [1;39m}[0m[1;39m,
              [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
              [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
                [0;32m"d"[0m[1;39m,
                [0;32m"i"[0m[1;39m,
                [0;32m"dt"[0m[1;39m,
                [0;32m"courseName"[0m[1;39m,
                [0;32m"courseLevel"[0m[1;39m,
                [0;32m"completionDate"[0m[1;39m
              [1;39m][0m[1;39m
            [1;39m}[0m[1;39m
          [1;39m][0m[1;39m
        [1;39m}[0m[1;39m
      [1;39m}[0m[1;39m,
      [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
      [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
        [0;32m"v"[0m[1;39m,
        [0;32m"d"[0m[1;39m,
        [0;32m"i"[0m[1;39m,
        [0;32m"ri"[0m[1;39m,
        [0;32m"s"[0m[1;39m,
        [0;32m"a"[0m[1;39m
      [1;39m][0m[1;39m
    [1;39m}[0m
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Employee Skill Schema
This schema defines the credential issued by the Company to the Employee. It includes an `e` (edges) section with an `NI2I` operator to reference the "Course Completion" credential and an `r` (rules) section for a verification policy.

Filename: `employee_skill_schema.json`


```python
skill_schema_path = "config/schemas/skill_certified_schema.json"
pr_title(f"Schema: {skill_schema_path}")

skill_schema_said = get_schema_said(skill_schema_path)
pr_message(f"Schema SAID: {skill_schema_said}")

pr_message(f"Retrieving Schema from Server:")
!curl -s http://vlei-server:7723/oobi/{skill_schema_said} | jq

pr_continue()
```

    
    [1m[4m[44m[90m  Schema: config/schemas/skill_certified_schema.json  [0m
    
    
    [1m[94mSchema SAID: EHELMpJ9ZjbrjXh2tiyw6MRkyar8g_7cn4OjNMUTU1Qu[0m
    
    
    [1m[94mRetrieving Schema from Server:[0m
    
    [1;39m{
      [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"EHELMpJ9ZjbrjXh2tiyw6MRkyar8g_7cn4OjNMUTU1Qu"[0m[1;39m,
      [0m[34;1m"$schema"[0m[1;39m: [0m[0;32m"http://json-schema.org/draft-07/schema#"[0m[1;39m,
      [0m[34;1m"title"[0m[1;39m: [0m[0;32m"EmployeeSkillCredential"[0m[1;39m,
      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential signifying a validated employee skill, supported by external evidence."[0m[1;39m,
      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
      [0m[34;1m"credentialType"[0m[1;39m: [0m[0;32m"EmployeeSkillCredential"[0m[1;39m,
      [0m[34;1m"version"[0m[1;39m: [0m[0;32m"1.0.0"[0m[1;39m,
      [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
        [0m[34;1m"v"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential Version String"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Credential SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"u"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"One time use nonce"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"i"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuer AID (Company's AID)"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"ri"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Registry SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"s"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Schema SAID"[0m[1;39m,
          [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"a"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"oneOf"[0m[1;39m: [0m[1;39m[
            [1;39m{
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes block SAID"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
            [1;39m}[0m[1;39m,
            [1;39m{
              [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"EOvGnWVRA0j_j6ZJvvTIMEWjemzfDWJUkQke5YX03CfB"[0m[1;39m,
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes block"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
              [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Attributes data SAID"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"i"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuee AID (Employee's AID)"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"dt"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Issuance date time"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                  [0m[34;1m"format"[0m[1;39m: [0m[0;32m"date-time"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"skillName"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The name of the certified skill."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"skillLevel"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The proficiency level of the skill."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"assessmentDate"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"The date the skill was assessed."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                  [0m[34;1m"format"[0m[1;39m: [0m[0;32m"date"[0m[1;39m
                [1;39m}[0m[1;39m
              [1;39m}[0m[1;39m,
              [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
              [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
                [0;32m"d"[0m[1;39m,
                [0;32m"i"[0m[1;39m,
                [0;32m"dt"[0m[1;39m,
                [0;32m"skillName"[0m[1;39m,
                [0;32m"skillLevel"[0m[1;39m,
                [0;32m"assessmentDate"[0m[1;39m
              [1;39m][0m[1;39m
            [1;39m}[0m[1;39m
          [1;39m][0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"e"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"oneOf"[0m[1;39m: [0m[1;39m[
            [1;39m{
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Edges block SAID"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
            [1;39m}[0m[1;39m,
            [1;39m{
              [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"ENG_fGLJf3AvDXPwNwH1d0zerxd0AXnpl-IKtRuRtTpT"[0m[1;39m,
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Edges block"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
              [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Edges block SAID"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"supporting_evidence"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Link to the Course Completion Credential that serves as supporting evidence."[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
                  [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                    [0m[34;1m"n"[0m[1;39m: [0m[1;39m{
                      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"SAID of the supporting Course Completion credential."[0m[1;39m,
                      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                    [1;39m}[0m[1;39m,
                    [0m[34;1m"s"[0m[1;39m: [0m[1;39m{
                      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"SAID of the required schema for the supporting credential."[0m[1;39m,
                      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                      [0m[34;1m"const"[0m[1;39m: [0m[0;32m"EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS"[0m[1;39m
                    [1;39m}[0m[1;39m,
                    [0m[34;1m"o"[0m[1;39m: [0m[1;39m{
                      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Operator indicating the issuer of this credential is NOT required to be the issuee of the linked credential."[0m[1;39m,
                      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                      [0m[34;1m"const"[0m[1;39m: [0m[0;32m"NI2I"[0m[1;39m
                    [1;39m}[0m[1;39m
                  [1;39m}[0m[1;39m,
                  [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
                  [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
                    [0;32m"n"[0m[1;39m,
                    [0;32m"s"[0m[1;39m,
                    [0;32m"o"[0m[1;39m
                  [1;39m][0m[1;39m
                [1;39m}[0m[1;39m
              [1;39m}[0m[1;39m,
              [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
              [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
                [0;32m"d"[0m[1;39m,
                [0;32m"supporting_evidence"[0m[1;39m
              [1;39m][0m[1;39m
            [1;39m}[0m[1;39m
          [1;39m][0m[1;39m
        [1;39m}[0m[1;39m,
        [0m[34;1m"r"[0m[1;39m: [0m[1;39m{
          [0m[34;1m"oneOf"[0m[1;39m: [0m[1;39m[
            [1;39m{
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Rules block SAID"[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
            [1;39m}[0m[1;39m,
            [1;39m{
              [0m[34;1m"$id"[0m[1;39m: [0m[0;32m"EI1YuEH0lTqhQXKMdIqHke116RDkCweKWDi3yvJe2n0_"[0m[1;39m,
              [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Rules governing the verification of this skill credential."[0m[1;39m,
              [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
              [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                [0m[34;1m"d"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Rules block SAID"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m
                [1;39m}[0m[1;39m,
                [0m[34;1m"verification_policy"[0m[1;39m: [0m[1;39m{
                  [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Verification Policy"[0m[1;39m,
                  [0m[34;1m"type"[0m[1;39m: [0m[0;32m"object"[0m[1;39m,
                  [0m[34;1m"properties"[0m[1;39m: [0m[1;39m{
                    [0m[34;1m"l"[0m[1;39m: [0m[1;39m{
                      [0m[34;1m"description"[0m[1;39m: [0m[0;32m"Associated legal language or policy text."[0m[1;39m,
                      [0m[34;1m"type"[0m[1;39m: [0m[0;32m"string"[0m[1;39m,
                      [0m[34;1m"const"[0m[1;39m: [0m[0;32m"Verification of this skill certification requires checking the validity of supporting evidence."[0m[1;39m
                    [1;39m}[0m[1;39m
                  [1;39m}[0m[1;39m
                [1;39m}[0m[1;39m
              [1;39m}[0m[1;39m,
              [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
              [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
                [0;32m"d"[0m[1;39m,
                [0;32m"verification_policy"[0m[1;39m
              [1;39m][0m[1;39m
            [1;39m}[0m[1;39m
          [1;39m][0m[1;39m
        [1;39m}[0m[1;39m
      [1;39m}[0m[1;39m,
      [0m[34;1m"additionalProperties"[0m[1;39m: [0m[0;39mfalse[0m[1;39m,
      [0m[34;1m"required"[0m[1;39m: [0m[1;39m[
        [0;32m"v"[0m[1;39m,
        [0;32m"d"[0m[1;39m,
        [0;32m"i"[0m[1;39m,
        [0;32m"ri"[0m[1;39m,
        [0;32m"s"[0m[1;39m,
        [0;32m"a"[0m[1;39m
      [1;39m][0m[1;39m
    [1;39m}[0m
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## Resolving Schema OOBIs

All three participants must resolve the OOBIs for both schemas to ensure they can understand and validate the credentials.


```python
pr_title("Resolving schema OOBIs")

course_schema_oobi = f"http://vlei-server:7723/oobi/{course_schema_said}"
skill_schema_oobi = f"http://vlei-server:7723/oobi/{skill_schema_said}"

# Participants resolving Course Completion Schema
!kli oobi resolve --name {training_provider_keystore_name} \
    --oobi-alias "course_schema" \
    --oobi {course_schema_oobi}

!kli oobi resolve --name {company_keystore_name} \
    --oobi-alias "course_schema" \
    --oobi {course_schema_oobi}

!kli oobi resolve --name {employee_keystore_name} \
    --oobi-alias "course_schema" \
    --oobi {course_schema_oobi}

# Participants resolving Employee Skill Schema
!kli oobi resolve --name {training_provider_keystore_name} \
    --oobi-alias "skill_schema" \
    --oobi {skill_schema_oobi}

!kli oobi resolve --name {company_keystore_name} \
    --oobi-alias "skill_schema" \
    --oobi {skill_schema_oobi}

!kli oobi resolve --name {employee_keystore_name} \
    --oobi-alias "skill_schema" \
    --oobi {skill_schema_oobi}

pr_message("Schema OOBIs resolved.")
pr_continue()
```

    
    [1m[4m[44m[90m  Resolving schema OOBIs  [0m
    
    http://vlei-server:7723/oobi/EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS resolved
    http://vlei-server:7723/oobi/EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS resolved
    http://vlei-server:7723/oobi/EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS resolved
    http://vlei-server:7723/oobi/EHELMpJ9ZjbrjXh2tiyw6MRkyar8g_7cn4OjNMUTU1Qu resolved
    http://vlei-server:7723/oobi/EHELMpJ9ZjbrjXh2tiyw6MRkyar8g_7cn4OjNMUTU1Qu resolved
    http://vlei-server:7723/oobi/EHELMpJ9ZjbrjXh2tiyw6MRkyar8g_7cn4OjNMUTU1Qu resolved
    
    [1m[94mSchema OOBIs resolved.[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## Issuing credentials
Now that the setup is complete and the schemas are available, it's necessary to create the credential chain.

### Step 1: Course Completion Credential Issuance (Training Provider to Employee)
First, the Training Provider issues the "Course Completion" credential to the Employee. This establishes the base credential that will be referenced later.

**Create Course Completion Credential Data**  

Create a JSON file with the specific attributes for the course completion.


```python
pr_title("Creating Course Completion credential data")

!echo '{ \
    "courseName": "Advanced Cryptographic Systems", \
    "courseLevel": "Expert", \
    "completionDate": "2024-09-15" \
}' > config/credential_data/course_cred_data.json

!cat config/credential_data/course_cred_data.json | jq

pr_continue()
```

    
    [1m[4m[44m[90m  Creating Course Completion credential data  [0m
    
    [1;39m{
      [0m[34;1m"courseName"[0m[1;39m: [0m[0;32m"Advanced Cryptographic Systems"[0m[1;39m,
      [0m[34;1m"courseLevel"[0m[1;39m: [0m[0;32m"Expert"[0m[1;39m,
      [0m[34;1m"completionDate"[0m[1;39m: [0m[0;32m"2024-09-15"[0m[1;39m
    [1;39m}[0m
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Training Provider Issues Credential
The Training Provider uses kli vc create to issue the credential.


```python
pr_title("Creating Course Completion credential")

issue_time_training = exec("kli time")
!kli vc create --name {training_provider_keystore_name} \
    --alias {training_provider_aid_alias} \
    --registry-name {training_provider_registry_name} \
    --schema {course_schema_said} \
    --recipient {employee_aid_prefix} \
    --data "@./config/credential_data/course_cred_data.json" \
    --time {issue_time_training}

course_credential_said = exec(f"kli vc list --name {training_provider_keystore_name} --alias {training_provider_aid_alias} --issued --said --schema {course_schema_said}")
pr_message(f"Course Credential SAID: {course_credential_said}")

pr_continue()
```

    
    [1m[4m[44m[90m  Creating Course Completion credential  [0m
    
    Waiting for TEL event witness receipts
    Sending TEL events to witnesses
    EOtQygzZ-a72tRrKidZsvRf9W1Z1uxbPGJ4Awx6TN_Hi has been created.
    
    [1m[94mCourse Credential SAID: EOtQygzZ-a72tRrKidZsvRf9W1Z1uxbPGJ4Awx6TN_Hi[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


**IPEX Transfer: Training Provider Grants, Employee Admits**  

The credential is transferred to the Employee using the standard IPEX grant/admit flow.


```python
pr_title("Transferring Course Completion credential (IPEX)")

time = exec("kli time")
!kli ipex grant --name {training_provider_keystore_name} \
    --alias {training_provider_aid_alias} \
    --said {course_credential_said} \
    --recipient {employee_aid_prefix} \
    --time {time}

# Employee polls for the grant and admits it
employee_grant_msg_said = exec(f"kli ipex list --name {employee_keystore_name} --alias {employee_aid_alias} --poll --said")
time = exec("kli time")
!kli ipex admit --name {employee_keystore_name} \
    --alias {employee_aid_alias} \
    --said {employee_grant_msg_said} \
    --time {time}

pr_message("\nEmployee's received Course Completion Credential:")
!kli vc list --name {employee_keystore_name} \
    --alias {employee_aid_alias} \
    --verbose

pr_continue()
```

    
    [1m[4m[44m[90m  Transferring Course Completion credential (IPEX)  [0m
    
    Sending message EN-qbMzDbUprGs3x4fs34bkV4wyhXfLsKqFRGVYP2i-4 to EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u
    ... grant message sent
    Sending admit message to EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk
    ... admit message sent
    
    [1m[94m
    Employee's received Course Completion Credential:[0m
    
    Current received credentials for employee (EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u):
    
    Credential #1: EOtQygzZ-a72tRrKidZsvRf9W1Z1uxbPGJ4Awx6TN_Hi
        Type: CourseCompletionCredential
        Status: Issued [92m✔[0m
        Issued by EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk
        Issued on 2025-06-24T20:04:12.427714+00:00
        Full Credential:
    	{
    	  "v": "ACDC10JSON0001dd_",
    	  "d": "EOtQygzZ-a72tRrKidZsvRf9W1Z1uxbPGJ4Awx6TN_Hi",
    	  "i": "EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk",
    	  "ri": "EPFig-G01GQwfcR3T19tpnHYvi76qIcv1i5bxF7BDyvX",
    	  "s": "EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS",
    	  "a": {
    	    "d": "EN0PV2OB2KCXIRkYFg7v11ViPzUCLItO08XCTJy_WFdP",
    	    "i": "EDO67I_DFhg4ygUScUR_48t2D2R6CMH5oguTJqWMJr_u",
    	    "dt": "2025-06-24T20:04:12.427714+00:00",
    	    "courseName": "Advanced Cryptographic Systems",
    	    "courseLevel": "Expert",
    	    "completionDate": "2024-09-15"
    	  }
    	}
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 2: Employee Skill Credential Issuance (Company to Employee)
Now, the Company issues the "Employee Skill Certified" credential, which will link to the one the Employee just received.

Create Data Blocks for Skill Credential
We need to create three separate JSON files for the attributes, the NI2I edge, and the rule.

**Attributes Data**   

Generic mock data to represent an access claim.


```python
pr_message("Employee Skill Credential Attributes")

skill_cred_data_file_path = "config/credential_data/skill_cred_data.json"

skill_data = {
    "skillName": "Secure System Design",
    "skillLevel": "Proficient",
    "assessmentDate": "2025-01-20"
}

with open(skill_cred_data_file_path, 'w') as f:
    json.dump(skill_data, f, indent=4)
    
!cat {skill_cred_data_file_path} | jq
```

    
    [1m[94mEmployee Skill Credential Attributes[0m
    
    [1;39m{
      [0m[34;1m"skillName"[0m[1;39m: [0m[0;32m"Secure System Design"[0m[1;39m,
      [0m[34;1m"skillLevel"[0m[1;39m: [0m[0;32m"Proficient"[0m[1;39m,
      [0m[34;1m"assessmentDate"[0m[1;39m: [0m[0;32m"2025-01-20"[0m[1;39m
    [1;39m}[0m


**Edge Data (NI2I) and SAIDification**  

The edge data is created, linking to the `course_credential_said` obtained in the previous step. The operator `o` is explicitly set to `NI2I`. This file is then SAIDified using `kli saidify` to populate its `d` field.


```python
pr_message("Employee Skill Credential Edges (NI2I)")

skill_cred_edge_file_path = "config/credential_data/skill_cred_edge.json"

skill_edge = {
    "d": "",
    "supporting_evidence": {
        "n": course_credential_said,
        "s": course_schema_said,
        "o": "NI2I"
    }
}

with open(skill_cred_edge_file_path, 'w') as f:
    json.dump(skill_edge, f, indent=4)
    
!kli saidify --file {skill_cred_edge_file_path}

!cat {skill_cred_edge_file_path} | jq
```

    
    [1m[94mEmployee Skill Credential Edges (NI2I)[0m
    
    [1;39m{
      [0m[34;1m"d"[0m[1;39m: [0m[0;32m"ENp3KA9iSrGFX81-ltvDmR9f9Udjy6D1qlY5jghBrmLN"[0m[1;39m,
      [0m[34;1m"supporting_evidence"[0m[1;39m: [0m[1;39m{
        [0m[34;1m"n"[0m[1;39m: [0m[0;32m"EOtQygzZ-a72tRrKidZsvRf9W1Z1uxbPGJ4Awx6TN_Hi"[0m[1;39m,
        [0m[34;1m"s"[0m[1;39m: [0m[0;32m"EF4BJfBb0xQhQke9yfoaepX6owHV9a5m2r-HjTLy59hS"[0m[1;39m,
        [0m[34;1m"o"[0m[1;39m: [0m[0;32m"NI2I"[0m[1;39m
      [1;39m}[0m[1;39m
    [1;39m}[0m


**Rule Data and SAIDification**  

The rule data is created and SAIDified.


```python
pr_message("Employee Skill Credential Rules")

skill_cred_rule_file_path = "config/credential_data/skill_cred_rule.json"

skill_rule = {
  "d": "",
  "verification_policy": {
    "l": "Verification of this skill certification requires checking the validity of supporting evidence."
  }
}
with open(skill_cred_rule_file_path, 'w') as f:
    json.dump(skill_rule, f, indent=4)
    
!kli saidify --file {skill_cred_rule_file_path}
!cat {skill_cred_rule_file_path} | jq
```

    
    [1m[94mEmployee Skill Credential Rules[0m
    
    [1;39m{
      [0m[34;1m"d"[0m[1;39m: [0m[0;32m"EAz-6zu_GnWWvec9hxuUebTjDwlbOP00gmJi7VBpuBcO"[0m[1;39m,
      [0m[34;1m"verification_policy"[0m[1;39m: [0m[1;39m{
        [0m[34;1m"l"[0m[1;39m: [0m[0;32m"Verification of this skill certification requires checking the validity of supporting evidence."[0m[1;39m
      [1;39m}[0m[1;39m
    [1;39m}[0m


Company Issues Skill Credential
The Company now creates the chained credential using kli vc create, supplying the attributes, edges, and rules files.


```python
time = exec("kli time")

!kli vc create --name {company_keystore_name} \
    --alias {company_aid_alias} \
    --registry-name {company_registry_name} \
    --schema {skill_schema_said} \
    --recipient {employee_aid_prefix} \
    --data  "@./config/credential_data/skill_cred_data.json" \
    --edges "@./config/credential_data/skill_cred_edge.json" \
    --rules "@./config/credential_data/skill_cred_rule.json" \
    --time {time}

skill_credential_said = exec(f"kli vc list --name {company_keystore_name} --alias {company_aid_alias} --issued --said --schema {skill_schema_said}")

pr_message(f"Employee Skill Credential SAID: {skill_credential_said}")

pr_continue()
```

    Waiting for TEL event witness receipts
    Sending TEL events to witnesses
    ^C
    
    [1m[94mEmployee Skill Credential SAID: None[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 3: Company Grants, Employee Admits Skill Credential

The final step is to transfer the newly created chained credential to the Employee.


```python
pr_title("Transferring Employee Skill Credential from Company to Employee")
time = exec("kli time")
!kli ipex grant --name {company_keystore_name} \
    --alias {company_aid_alias} \
    --said {skill_credential_said} \
    --recipient {employee_aid_prefix} \
    --time {time}

pr_title("Employee admitting Skill Credential")
# Employee polls for the grant and admits it
employee_skill_grant_msg_said = exec(f"kli ipex list --name {employee_keystore_name} --alias {employee_aid_alias} --poll --said")
time = exec("kli time")
!kli ipex admit --name {employee_keystore_name} \
    --alias {employee_aid_alias} \
    --said {employee_skill_grant_msg_said} \
    --time {time}

pr_message("\nEmployee's received Employee Skill Credential:")
!kli vc list --name {employee_keystore_name} --alias {employee_aid_alias} --said {skill_credential_said} --verbose

pr_continue()
```

    
    [1m[4m[44m[90m  Transferring Employee Skill Credential from Company to Employee  [0m
    
    ERR: no credential found with said None
    
    [1m[4m[44m[90m  Employee admitting Skill Credential  [0m
    
    Sending admit message to EEDHBpqSRlpIKzc0_AhFx7H2HY0qiQawpJKPyXdS0Byk
    ERR: 'tuple' object does not support item deletion
    
    [1m[94m
    Employee's received Employee Skill Credential:[0m
    
    usage: kli [-h] command ...
    kli: error: unrecognized arguments: None
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


When you view the final "Employee Skill Credential" held by the Employee, you will see:

- The attributes (`a` section) for the certified skill.
- The edge (`e` section) with `supporting_evidence` linking to the Course Completion ACDC's SAID (n) and using the `NI2I` operator (`o`).
- The rule (`r` section) with the `verification_policy`.

This confirms the successful creation and issuance of a chained credential using an NI2I edge to provide external, verifiable context.

<div class="alert alert-primary">
<b>📝 SUMMARY</b><hr>
This notebook demonstrated the creation of a chained ACDC relationship using a Not-Issuer-To-Issuee (NI2I) edge and the inclusion of a rule.
<ol>
<li><b>Setup:</b> Three participants (Training Provider, Company, Employee) were initialized with keystores, AIDs, and credential registries for the issuers. OOBI connections were established between them.</li>
<li><b>Schema Preparation:</b> Two schemas, one for "Course Completion" and another for "Skill Certified" (which included definitions for <code>e</code> and <code>r</code> sections), were resolved by all parties from a schema server.</li>
<li><b>Base Credential Issuance (Training Provider to Employee):</b>
<ul>
<li>The Training Provider issued a "Course Completion" ACDC to the Employee.</li>
<li>This credential was transferred via IPEX and admitted by the Employee. The SAID of this credential was saved for the next step.</li>
</ul>
</li>
<li><b>Chained Credential Issuance (Company to Employee):</b>
<ul>
<li>The Company prepared the data for the "Employee Skill" ACDC.</li>
<li>An <b>edge file</b> was created, linking to the previously issued "Course Completion" ACDC's SAID and explicitly using the <b><code>"o": "NI2I"</code></b> operator. This file was SAIDified.</li>
<li>A <b>rule file</b> was created with a custom policy and was also SAIDified.</li>
<li>The Company issued the "Employee Skill" ACDC using <code>kli vc create</code>, supplying the attributes, edges, and rules files.</li>
<li>This second credential was transferred to the Employee via IPEX.</li>
</ul>
</li>
<li><b>Verification:</b> The final ACDC held by the Employee contained the skill attributes, the NI2I edge pointing to the course certificate as supporting evidence, and the embedded verification policy rule, successfully demonstrating the NI2I use case.</li>
</ol>
</div>


```python
# from scripts.saidify import process_schema_file

# # Run the saidify script
# process_schema_file("./config/schemas/course_completion_schema.bak.json", "./config/schemas/course_completion_schema.json", True)
# process_schema_file("./config/schemas/skill_certified_schema.bak.json", "./config/schemas/skill_certified_schema.json", True)
```
