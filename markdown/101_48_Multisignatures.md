# KERI Core: Multi-Signature Group Identifiers

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
This notebook introduces the concept of multi-signature (multisig) group Autonomic Identifiers (AIDs) in KERI. It will demonstrate how to:
<ul>
<li>Set up individual AIDs that will participate in a multisig group.</li>
<li>Configure and incept a multisig group AID where actions require signatures from multiple participants.</li>
<li>Perform interaction events with the multisig group AID.</li>
<li>Rotate the keys for the multisig group AID.</li>
<li>Understand the structure of inception (<code>icp</code>), interaction (<code>ixn</code>), and rotation (<code>rot</code>) events for multisig group AIDs.</li>
</ul>
</div>

## Introduction to Multi-Signatures
Multi-signature (multisig) schemes in KERI enhance security and enable collective control over an identifier by requiring signatures from multiple authorized keys to validate an event. This is particularly useful for organizations or groups where shared authority is necessary. 

A multi-signature group AID is essentially an identifier whose controlling authority is distributed among a set of participating AIDs. Each key event for this group AID, such as inception, interaction, or rotation, must be authorized by a sufficient number of these participating AIDs, according to the defined signing threshold.

## Initial Setup of Participant AIDs

The setup involves:

- Individual Participant AIDs: Each entity that will be part of the multisig group first has its own individual AID.
- Group Configuration: A configuration is defined specifying which AIDs are members of the group and the signing threshold (e.g., 2 out of 3 participants must sign).
- Group Inception: The multisig group AID is incepted. This is a cooperative process where participating AIDs signal their agreement to form the group. The resulting group AID prefix is often a self-addressing identifier derived from its inception event data, which includes the participating AIDs and the signing policies.
- Group Operations: Subsequent operations like interaction events or key rotations for the group AID also require the specified threshold of signatures from the participating AIDs.

For this notebook, we will create two AIDs, `multisig1_alias` and `multisig2_alias`, each in its own keystore. These will act as the initial members of our multisig group.


```python
# Imports and Utility functions
from scripts.utils import exec, exec_bg, clear_keri
from scripts.utils import pr_continue, pr_title, pr_message
import json
import time

clear_keri()

# multisig1 Keystore
multisig1_keystore="multisig1_keystore"
multisig1_salt= exec("kli salt")
multisig1_alias = "multisig1_alias"

pr_title("Initializing keystores")

# The `keystore_init_config.json` file is used here 
# to pre-configure the keystores with default witness information.
!kli init --name {multisig1_keystore} \
    --nopasscode \
    --salt {multisig1_salt} \
    --config-dir ./config \
    --config-file keystore_init_config.json

# multisig2 Keystore
multisig2_keystore="multisig2_keystore"
multisig2_salt= exec("kli salt")
multisig2_alias = "multisig2_alias"

!kli init --name {multisig2_keystore} \
    --nopasscode \
    --salt {multisig2_salt} \
    --config-dir ./config \
    --config-file keystore_init_config.json

pr_title("Incepting multisig parts")

# multisig1 AID inception
!kli incept --name {multisig1_keystore} \
    --alias {multisig1_alias} \
    --icount 1 \
    --isith 1 \
    --ncount 1 \
    --nsith 1 \
    --wits BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha \
    --wits BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM \
    --wits BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX \
    --toad 2 \
    --transferable

# multisig2 AID Inception
!kli incept --name {multisig2_keystore} \
    --alias {multisig2_alias} \
    --icount 1 \
    --isith 1 \
    --ncount 1 \
    --nsith 1 \
    --wits BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha \
    --wits BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM \
    --wits BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX \
    --toad 2 \
    --transferable

pr_continue()

```

    Proceeding with deletion of '/usr/local/var/keri/' without confirmation.
    ⚠️ Path not found: /usr/local/var/keri/. Nothing to remove.



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Initializing keystores</span>
</pre>



    KERI Keystore created at: /usr/local/var/keri/ks/multisig1_keystore
    KERI Database created at: /usr/local/var/keri/db/multisig1_keystore
    KERI Credential Store created at: /usr/local/var/keri/reg/multisig1_keystore
    
    Loading 3 OOBIs...
    http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?name=Wan&tag=witness succeeded
    http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?name=Wes&tag=witness succeeded
    http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?name=Wil&tag=witness succeeded
    KERI Keystore created at: /usr/local/var/keri/ks/multisig2_keystore
    KERI Database created at: /usr/local/var/keri/db/multisig2_keystore
    KERI Credential Store created at: /usr/local/var/keri/reg/multisig2_keystore
    
    Loading 3 OOBIs...
    http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?name=Wan&tag=witness succeeded
    http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?name=Wes&tag=witness succeeded
    http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?name=Wil&tag=witness succeeded



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Incepting multisig parts</span>
</pre>



    Waiting for witness receipts...
    Prefix  EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp
    	Public key 1:  DH97nsnEh-miXmUCCBNOu0_hAw7-y58UiKlCUbbUYfzc
    
    Waiting for witness receipts...
    Prefix  EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_
    	Public key 1:  DBVKekw6wac74IqMw4MtDDGPh4OwBam1Hnp4bzYLSmDo
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Incepting multisig parts</span>
</pre>



    Waiting for witness receipts...


    Prefix  EFZh0IQg26cUMg7lI4MicB6uBurGwPVHqzVhYB_mKyim
    	Public key 1:  DF2nnVqhYRMnt3uhCBdLM_rmoPXZCTdyvoCvospDY7Mp
    


    Waiting for witness receipts...


    Prefix  ELeMeGGMXf4buHA61qNxuAVBylnBi15IA61zN4Heoiai
    	Public key 1:  DMLY14-xBXPVxbB2kYZcJQPkCO3A0DLCvfsTqYKetkPB
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



##  Creating the Multi-Signature Group AID

With the individual participant AIDs in place, now proceed to create the multisig group AID. This involves several steps: 
- authorizing mailbox roles for discovery
- exchanging OOBIs
- configuring the multisig parameters
- cooperatively incepting the group AID.

### Adding Mailbox Role

To allow the cooperative inception process, each participant AID needs to authorize one of its witnesses to act as a `mailbox`. This allows other participants to send messages (like the group inception proposal) to them indirectly via this witness.

The `kli ends add` command is used to authorize an end role.
`--eid`: Specifies the prefix of the witness AID being authorized for the new role.
`--role`: Defines the role being assigned.


```python
# Add new endpoint role authorization.
pr_title("Adding mailbox role")

role = "mailbox"

!kli ends add --name {multisig1_keystore} \
    --alias {multisig1_alias} \
    --eid BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM \
    --role {role}

# Add new endpoint role authorization.
!kli ends add --name {multisig2_keystore} \
    --alias {multisig2_alias} \
    --eid BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX \
    --role {role}

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Adding mailbox role</span>
</pre>



    End role authorization added for role mailbox
    End role authorization added for role mailbox



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Resolving OOBIs

Next, the participants need to discover each other. This is done by generating and resolving Out-of-Band Introductions (OOBIs) that point to their newly authorized mailbox endpoints.


```python
# OOBI Generation
pr_title("Generating OOBIs")

# multisig1 generates mailbox OOBI for its AID
multisig1_oobi = exec(f"kli oobi generate --name {multisig1_keystore} --alias {multisig1_alias} --role {role}")

# multisig2 generates mailbox OOBI for its AID
multisig2_oobi = exec(f"kli oobi generate --name {multisig2_keystore} --alias {multisig2_alias} --role {role}")

pr_message("Multisig part 1 OOBI: " + multisig1_oobi)
pr_message("Multisig part 2 OOBI: " + multisig2_oobi)

# OOBI Exchange
pr_title("Resolving OOBIs")
!kli oobi resolve --name {multisig1_keystore} \
    --oobi-alias {multisig2_alias} \
    --oobi {multisig2_oobi}

!kli oobi resolve --name {multisig2_keystore} \
    --oobi-alias {multisig1_alias} \
    --oobi {multisig1_oobi}

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Generating OOBIs</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig part </span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">1</span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold"> OOBI: </span>
<span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold; text-decoration: underline">http://witness-demo:5643/oobi/EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp/mailbox/BLskRTInXnMxWaGqcpSyMgo0nYbalW99</span>
<span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold; text-decoration: underline">cGZESrz3zapM</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig part </span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">2</span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold"> OOBI: </span>
<span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold; text-decoration: underline">http://witness-demo:5644/oobi/EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_/mailbox/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja</span>
<span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold; text-decoration: underline">2LigFYZN2YfX</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Resolving OOBIs</span>
</pre>



    http://witness-demo:5644/oobi/EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_/mailbox/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX resolved
    http://witness-demo:5643/oobi/EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp/mailbox/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM resolved



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Configuring the Multi-Signature Group

The parameters for the multisig group AID are defined in a JSON configuration file. This file specifies:

- `aids`: A list of the prefixes of the participating AIDs.
- `transferable`: Whether the group AID itself will be transferable (i.e., its keys can be rotated).
- `wits`: A list of witness AIDs for the group AID.
- `toad`: The Threshold of Accountable Duplicity for the group AID's events. This defines how many witness receipts are needed for an event to be considered accountable by the controller group.
- `isith`: The initial signing threshold for the group AID's inception event. This can be an integer (e.g., "2" for 2-of-N) or a list of weights for a weighted threshold scheme. For this example, "2" means both participants must sign.
- `nsith`: The signing threshold for the next key set (for future rotations). Similar to isith.



```python
# Multisig Configuration
pr_title(f"Building multisig config file")

# Multisig participants prefixes
multisig1_pre = exec(f"kli aid --name {multisig1_keystore} --alias {multisig1_alias}")
multisig2_pre = exec(f"kli aid --name {multisig2_keystore} --alias {multisig2_alias}")

pr_message("Multisig part 1 prefix: " + multisig1_pre)
pr_message("Multisig part 2 prefix: " + multisig1_pre)

# multisig configuration
multisig_config = {
  "aids": [
    multisig1_pre,
    multisig2_pre
  ],
  "transferable": True,
  "wits": [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
    "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
  ],
  "toad": 2,
  "isith": "2",
  "nsith": "2"
}

# Specify the filename
file_path = './config/multisig/multisig_config.json'

# Write the configuration data to the JSON file
with open(file_path, 'w') as f:
  json.dump(multisig_config, f, indent=2)

pr_message(f"Multisig config: {file_path}")
!cat {file_path}

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Building multisig config file</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig part </span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">1</span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold"> prefix: EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig part </span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">2</span><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold"> prefix: EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp</span>
</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig config: ./config/multisig/multisig_config.json</span>
</pre>



    {
      "aids": [
        "EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp",
        "EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_"
      ],
      "transferable": true,
      "wits": [
        "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
        "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
        "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
      ],
      "toad": 2,
      "isith": "2",
      "nsith": "2"
    }


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Incepting the Multi-Signature Group AID

The inception of a multisig group AID is a cooperative process. One participant (here, `multisig1_alias`) initiates the group inception using `kli multisig incept`.
  - `--group`: Assigns a human-readable alias to the multisig group AID being created.
  - `--file`: Points to the JSON configuration file created in the previous step.  

This command will propose the inception event and wait for other members to join and sign. The other participant(s) (here, `multisig2_alias`) join the proposed inception using `kli multisig join`.
  - `--group`: Specifies the alias of the group they are joining.
  - `--auto`: Automatically approves the join request **(in a real scenario, this would be an interactive confirmation)**. This command will fetch the proposed event, sign it, and send its signature back.

Once all required signatures are gathered, the inception event is finalized and published to the witnesses.
These commands are run in the background here, as they would normally be interactive, waiting for each other.


```python
pr_title(f"Incepting multisig AID")

multisig_group = "multisig_group"

command = f"""
kli multisig incept --name {multisig1_keystore} \
    --alias {multisig1_alias} \
    --group {multisig_group} \
    --file {file_path} > ./logs/multisig_event.log
"""
incept1_process = exec_bg(command)

command = f"""
kli multisig join --name {multisig2_keystore} \
    --group {multisig_group} \
    --auto > ./logs/multisig_join.log
"""
join_process = exec_bg(command)

while(incept1_process.poll() is None or join_process.poll() is None): 
    print("Waiting for multisig inception to complete...\n")
    time.sleep(2)

# Show the output of the background processes
pr_message(f"Multisig Event")
!cat ./logs/multisig_event.log

pr_message(f"Multisig Join")
!cat ./logs/multisig_join.log

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Incepting multisig AID</span>
</pre>



    Command 
    kli multisig incept --name multisig1_keystore     --alias multisig1_alias     --group multisig_group     --file ./config/multisig/multisig_config.json > ./logs/multisig_event.log
     started with PID: 14203
    Command 
    kli multisig join --name multisig2_keystore     --group multisig_group     --auto > ./logs/multisig_join.log
     started with PID: 14204
    Waiting for multisig inception to complete...
    
    Waiting for multisig inception to complete...
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Event</span>
</pre>



    Group identifier inception initialized for EG3X1AxcORiGCbM5WyNgzoCWkWXy5N5f5-35Uuzmzw7-
    
    Alias: 	multisig_group
    Identifier: EG3X1AxcORiGCbM5WyNgzoCWkWXy5N5f5-35Uuzmzw7-
    Seq No:	0
    Group Identifier
        Local Indentifier:  EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp [92m✔ Fully Signed[0m
    
    Witnesses:
    Count:		3
    Receipts:	3
    Threshold:	2
    
    Public Keys:	
    	1. DH97nsnEh-miXmUCCBNOu0_hAw7-y58UiKlCUbbUYfzc
    	2. DBVKekw6wac74IqMw4MtDDGPh4OwBam1Hnp4bzYLSmDo
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Join</span>
</pre>



    Waiting for group multisig events...
    
    Group Multisig Inception proposed:
    Participants:
    +-------+-----------------+----------------------------------------------+
    | Local | Name            |                     AID                      |
    +-------+-----------------+----------------------------------------------+
    |       | multisig1_alias | EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp |
    |   *   | multisig2_alias | EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_ |
    +-------+-----------------+----------------------------------------------+
    
    Configuration:
    +---------------------+----------------------------------------------+
    | Name                |                    Value                     |
    +---------------------+----------------------------------------------+
    | Signature Threshold |                      2                       |
    | Establishment Only  |                    False                     |
    | Do Not Delegate     |                    False                     |
    | Witness Threshold   |                      2                       |
    | Witnesses           | BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha |
    |                     | BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM |
    |                     | BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX |
    +---------------------+----------------------------------------------+
    
    Alias: 	multisig_group
    Identifier: EG3X1AxcORiGCbM5WyNgzoCWkWXy5N5f5-35Uuzmzw7-
    Seq No:	0
    Group Identifier
        Local Indentifier:  EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_ [92m✔ Fully Signed[0m
    
    Witnesses:
    Count:		3
    Receipts:	3
    Threshold:	2
    
    Public Keys:	
    	1. DH97nsnEh-miXmUCCBNOu0_hAw7-y58UiKlCUbbUYfzc
    	2. DBVKekw6wac74IqMw4MtDDGPh4OwBam1Hnp4bzYLSmDo
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Verifying Multi-Signature AID Status

After successful inception, you can check the status of the `multisig_group` AID using `kli status --verbose`.
The output shows the inception event (`icp`). Key fields for a multisig AID include:

- `i`: The prefix of the multisig group AID.
- `k`: A list of the public keys of the participating AIDs that form the current signing key set for the group.
- `kt`: The current signing threshold (e.g., "2", meaning 2 signatures are required).
- `n`: A list of digests of the public keys for the next rotation (pre-rotation).
- `nt`: The signing threshold for the next key set.
- `b`: The list of witness AIDs for this group AID.
- `bt`: The Threshold of Accountable Duplicity (TOAD) for this group AID.  

This inception event (`icp`) is an establishment event that cryptographically binds the group AID to its initial set of controlling keys (the participants' keys) and the defined signing policies.


```python
pr_title(f"Multisig AID status")
!kli status --name multisig1_keystore --alias multisig_group --verbose
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Multisig AID status</span>
</pre>



    Keystore must already exist, exiting


## Interaction Event with Multi-Signature Group AID

An interaction event (`ixn`) is a non-establishment event used to anchor arbitrary data to the Key Event Log (KEL) of an AID. For a multisig group AID, an interaction event must also be signed by the required threshold of participating AIDs.

The `kli multisig interact` command initiates an interaction event for the group, and `kli multisig join` is used by other participants to add their signatures.


```python
pr_title(f"Performing interaction event")

# Anchor data for the interaction event (ixn)
data = """'{"d": "arbitrary data"}'""" # Keep string format as is!

command = f"""
kli multisig interact --name {multisig1_keystore} \
    --alias {multisig_group} \
    --data {data} > ./logs/multisig_event.log
"""

interact1_process = exec_bg(command)

command = f"""
kli multisig join --name {multisig2_keystore} \
    --group {multisig_group} \
    --auto > ./logs/multisig_join.log
"""
join_process = exec_bg(command)

while(interact1_process.poll() is None or join_process.poll() is None): 
    print("Waiting for multisig interaction to complete...\n")
    time.sleep(2)

# Show the output of the background processes
pr_message(f"Multisig Event")
!cat ./logs/multisig_event.log

pr_message(f"Multisig Join")
!cat ./logs/multisig_join.log

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Performing interaction event</span>
</pre>



    Command 
    kli multisig interact --name multisig1_keystore     --alias multisig_group     --data '{"d": "arbitrary data"}' > ./logs/multisig_event.log
     started with PID: 14244
    Command 
    kli multisig join --name multisig2_keystore     --group multisig_group     --auto > ./logs/multisig_join.log
     started with PID: 14245
    Waiting for multisig interaction to complete...
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Event</span>
</pre>



    Keystore must already exist, exiting



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Join</span>
</pre>



    Keystore must already exist, exiting



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Verifying Interaction Event
Let's examine the KEL for `multisig_group` again to see the `ixn` event.  
The interaction event (`ixn`) does not change the establishment keys but anchors data (`a` field) to the KEL. It is signed by the current authoritative keys established by the preceding `icp` event. The `p` field contains the digest of the previous event (`icp` in this case), ensuring the chain's integrity.


```python
pr_title(f"Multisig AID status")
!kli status --name multisig1_keystore --alias multisig_group --verbose
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Multisig AID status</span>
</pre>



    Keystore must already exist, exiting


## Rotation Event for Multi-Signature Group AID

Rotating the keys for a multisig group AID also requires a cooperative process.

### Rotating Individual Participant Keys
First, each individual participant AID must rotate its own keys. This ensures that when they participate in the group rotation, they are using their new, updated keys. The `kli rotate` command is used for individual AID key rotation, and `kli query` can be used to ensure other participants are aware of these individual rotations.


```python
pr_title(f"Rotating multisig-parts keys")

!kli rotate --name {multisig1_keystore} \
    --alias {multisig1_alias}

!kli query --name {multisig2_keystore} \
    --alias {multisig2_alias} \
    --prefix {multisig1_pre}

!kli rotate --name {multisig2_keystore} \
    --alias {multisig2_alias}

!kli query --name {multisig1_keystore} \
    --alias {multisig1_alias} \
    --prefix {multisig2_pre}

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Rotating multisig-parts keys</span>
</pre>



    Keystore must already exist, exiting
    Keystore must already exist, exiting
    Keystore must already exist, exiting
    Keystore must already exist, exiting



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



    Checking for updates...


    
    
    Identifier: EFZh0IQg26cUMg7lI4MicB6uBurGwPVHqzVhYB_mKyim
    Seq No:	1
    
    Witnesses:
    Count:		3
    Receipts:	3
    Threshold:	3
    
    Public Keys:	
    	1. DHkwumFe8fIxGkqSmsx29MoQnBF0QtMLKvZuZ6FSKBZi
    


    Waiting for witness receipts...


    Prefix  ELeMeGGMXf4buHA61qNxuAVBylnBi15IA61zN4Heoiai
    New Sequence No.  1
    	Public key 1:  DLTuSMibYqmwVDC64Q_TgvRzuWcqHcEseFiBmiUg4w3x


    Checking for updates...


    
    
    Identifier: ELeMeGGMXf4buHA61qNxuAVBylnBi15IA61zN4Heoiai
    Seq No:	1
    
    Witnesses:
    Count:		3
    Receipts:	3
    Threshold:	3
    
    Public Keys:	
    	1. DLTuSMibYqmwVDC64Q_TgvRzuWcqHcEseFiBmiUg4w3x
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Rotating the Multi-Signature Group Keys
Once the participants have rotated their individual keys, the group rotation can proceed.
The `kli multisig rotate` command initiates the rotation for the group.

- `--smids`: Specifies the list of participant AIDs (their current prefixes after their individual rotations) that are authorized to sign this rotation event.
- `--rmids`: Specifies the list of participant AIDs that will form the new signing set for the next rotation (pre-rotation).
- `--isith`: The signing threshold for the current rotation event. Here, `["1/2", "1/2"]` represents a weighted threshold where each of the two participants has a weight of 1/2, and a sum of 1 (i.e., both signatures) is required.
- `--nsith`: The signing threshold for the next set of keys (pre-rotation).  

Again, `kli multisig join` is used by the other participant to co-sign the group rotation event.


```python
pr_title(f"Rotating multisig group")

command = f"""
kli multisig rotate --name {multisig1_keystore} \
    --alias {multisig_group} \
    --smids {multisig1_pre} \
    --smids {multisig2_pre} \
    --rmids {multisig1_pre} \
    --rmids {multisig2_pre} \
    --isith '["1/2", "1/2"]' \
    --nsith '["1/2", "1/2"]' > ./logs/multisig_event.log
"""
incept_process = exec_bg(command)

command = f"""
kli multisig join --name {multisig2_keystore} \
    --group {multisig_group} \
    --auto > ./logs/multisig_join.log
"""
join_process = exec_bg(command)

while(incept_process.poll() is None or join_process.poll() is None): 
    print("Waiting for multisig rotation to complete...\n")
    time.sleep(2)

# Show the output of the background processes
pr_message(f"Multisig Event")
!cat ./logs/multisig_event.log

pr_message(f"Multisig Join")
!cat ./logs/multisig_join.log

pr_continue()
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Rotating multisig group</span>
</pre>



    Command 
    kli multisig rotate --name multisig1_keystore     --alias multisig_group     --smids EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp     --smids EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_     --rmids EBIzC9Z5pCUqmLSZ-BW5ouoa8wo-aRlkGJAuMp6aLemp     --rmids EFVi3nAa7yIZyx5SLngEhqKRmjguGT_eGMPLeOW1k7O_     --isith '["1/2", "1/2"]'     --nsith '["1/2", "1/2"]' > ./logs/multisig_event.log
     started with PID: 14278
    Command 
    kli multisig join --name multisig2_keystore     --group multisig_group     --auto > ./logs/multisig_join.log
     started with PID: 14279
    Waiting for multisig rotation to complete...
    



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Event</span>
</pre>



    Keystore must already exist, exiting



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #5f5fff; text-decoration-color: #5f5fff; font-weight: bold">Multisig Join</span>
</pre>



    Keystore must already exist, exiting



<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>




<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #008000; text-decoration-color: #008000">You can continue ✅</span>

</pre>



### Verifiying rotation event

Let's inspect the KEL of `multisig_group` one last time.
The `rot` event (type `rot`) is an establishment event that signifies a change in the controlling keys.

- `s`: The sequence number is incremented.
- `p`: Contains the digest of the previous event (the ixn event in this case).
- `kt`: The signing threshold for this rotation. It's now a list `["1/2", "1/2"]`, reflecting the weighted threshold specified.
- `k`: The list of public keys of the participants that are now the current authoritative signers for the group. These are the new keys from the individual participant rotations.
- `nt`: The signing threshold for the next rotation (pre-rotation).
- `n`: A list of digests of the public keys for the next rotation.
- `br`: List of witnesses to remove (empty in this case).
- `ba`: List of witnesses to add (empty in this case).

This `rot` event demonstrates how the control of the multisig group AID has been transferred to a new set of keys (derived from the participants' new keys) and how a new pre-rotation commitment has been made for the next cycle, all while maintaining the integrity of the KEL through cryptographic chaining and multi-signature authorization.


```python
pr_title(f"Multisig AID status")
!kli status --name multisig1_keystore --alias multisig_group --verbose
```


<pre style="white-space:pre;overflow-x:auto;line-height:normal;font-family:Menlo,'DejaVu Sans Mono',consolas,'Courier New',monospace"><span style="color: #0000ff; text-decoration-color: #0000ff; font-weight: bold">Multisig AID status</span>
</pre>



    Keystore must already exist, exiting


<div class="alert alert-prymary">
<b>📝 SUMMARY</b><hr>
This notebook demonstrated the creation and management of a multi-signature (multisig) group AID in KERI.
<ul>
<li><b>Participant Setup:</b> Individual AIDs for each participant were created and their mailboxes configured for discovery via OOBIs.</li>
<li><b>Group Configuration:</b> A JSON file defined the participating AIDs, witness set, TOAD, and signing thresholds (<code>isith</code>, <code>nsith</code>) for the group.</li>
<li><b>Group Inception (<code>icp</code>):</b> The multisig group AID was incepted cooperatively using <code>kli multisig incept</code> by one participant and <code>kli multisig join</code> by the other(s). The resulting <code>icp</code> event in the group's KEL lists the participants' public keys (<code>k</code>) and the signing threshold (<code>kt</code>).</li>
<li><b>Group Interaction (<code>ixn</code>):</b> An interaction event was performed by the group, requiring signatures from the participants according to the current threshold. The <code>ixn</code> event anchored data to the group's KEL.</li>
<li><b>Group Rotation (<code>rot</code>):</b>
<ul>
<li>Individual participant AIDs first rotated their own keys.</li>
<li>The multisig group AID then performed a rotation using <code>kli multisig rotate</code> and <code>kli multisig join</code>. This involved specifying the new set of signing members (<code>--smids</code>), the pre-rotated members for the next rotation (<code>--rmids</code>), and potentially new signing thresholds (<code>--isith</code>, <code>--nsith</code>), which can include weighted schemes.</li>
<li>The <code>rot</code> event in the group's KEL updated the list of authoritative keys (<code>k</code>), the signing threshold (<code>kt</code>), and the pre-rotation commitment (<code>n</code>, <code>nt</code>).</li>
</ul>
</li>
</ul>
Throughout this process, KERI's cryptographic chaining and signature verification ensure the integrity and authenticity of the multisig group's key events.
</div>


```python

```
