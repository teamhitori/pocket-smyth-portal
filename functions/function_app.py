"""Pocket Smyth Provisioning Functions.

Azure Functions (Python v2 model) for async user stack provisioning.
Triggered by Azure Queue Storage messages.
"""

import azure.functions as func
import logging

app = func.FunctionApp()


@app.queue_trigger(
    arg_name="msg",
    queue_name="provisioning",
    connection="AzureWebJobsStorage",
)
def provision_user(msg: func.QueueMessage) -> None:
    """Provision a new user stack on the VM.

    Flow:
    1. Parse queue message (user_id, username)
    2. SSH to VM (key from Key Vault)
    3. Run provision-user.sh (docker compose up)
    4. Update B2C: status=active, containerPort=XXXX
    5. Update Traefik file provider (dynamic route)
    """
    logging.info("Provisioning user: %s", msg.get_body().decode("utf-8"))
    # TODO: Phase 6 — implement provisioning logic
    raise NotImplementedError("Provisioning not yet implemented")


@app.queue_trigger(
    arg_name="msg",
    queue_name="deprovisioning",
    connection="AzureWebJobsStorage",
)
def deprovision_user(msg: func.QueueMessage) -> None:
    """De-provision a user stack (stop container, remove route, preserve data).

    Flow:
    1. Parse queue message (user_id, username)
    2. SSH to VM → docker compose down
    3. Remove Traefik route
    4. Update B2C: status=revoked
    """
    logging.info("De-provisioning user: %s", msg.get_body().decode("utf-8"))
    # TODO: Phase 6 — implement de-provisioning logic
    raise NotImplementedError("De-provisioning not yet implemented")
