# vLEI Trainings

The official collection of GLEIF training materials for the vLEI ecosystem including both software developer focused trainings and executive focused trainings. Topics include wallet development, core protocol explanations, infrastructure deployment and usage, and threshold logic ranging across an increasing learning curve.

Trainings are organized into the following levels.
- 100 - 199: Basic 
    - you understand core protocols and can use basic vLEI infrastructure and credentials
- 200 - 299: Intermediate (Not yet available)
    - you can use advanced infrastructure and credential chains
- 300 - 399: Advanced (Not yet available)
    - you can use advanced thresholds for signing and verification
- 400 - 499: Expert (Not yet available)
    - you can use and extend advanced low level protocols

# Training Environment Setup

[Jupyter notebooks](https://jupyter.org/) are the primary format for developer-focused content while Markdown and associated PDFs are the primary format for executive-focused content.

To deploy the training environment, we use Docker to create a local instance of the vLEI ecosystem. This allows you to run the training materials in an isolated environment on your local machine.

## Prerequisites

* [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Docker](https://docs.docker.com/get-docker/)

## Setup and Deployment

1.  **Clone the Repository:**
    ```bash
    git clone git clone https://github.com/GLEIF-IT/vlei-trainings.git
    cd vlei-trainings
    ```

2.  **Deploy the Environment:**
    Run the deployment script. This will build the necessary Docker images (can take a while the first time) and start all the containers in the background.
    ```bash
    ./deploy.sh
    ```

3. **Stop the environment:**
    If you need to stop the environment, run:
    ```bash
    ./stop.sh
    ```

## Accessing the Environment

1.  **Jupyter Lab:**
    Open your web browser and navigate to [http://localhost:8888](http://localhost:8888).


### Authors
- Esteban Garcia (GLEIF)

