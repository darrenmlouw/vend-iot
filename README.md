# Vendiot

Vendiot is a real-time IoT dashboard for monitoring and managing vending machine data, utilizing MQTT for message communication and AWS Timestream for data storage and queries.

## Prerequisites
Before you begin, ensure you have the following: 
- **Node.js**: VendIoT requires Node.js LTS to run. Download and install it from [nodejs.org](https://nodejs.org/).
- **npm**: npm (Node Package Manager) is used to install dependencies. It comes with Node.js, but you can ensure you have the latest version by running `npm install npm@latest -g`.
- **Git**: Git is required to clone the repository. Download and install it from [git-scm.com](https://git-scm.com/).
- **AWS Account**: Since the project utilizes AWS services, including AWS IoT and Timestream, you need an AWS account. 

Ensure that you have the required AWS credentials (access key ID, secret access key, and optionally a session token) to configure the project's environment variables for AWS connectivity.


After installing the prerequisites, proceed to the **Installation** section to set up the project.

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/darrenmlouw/VendIoT.git
```

2. Navigate to the Porject Directory
```bash
cd VendIoT
```

3. Install Node Dependencie
```bash
npm install
```

## Configuration
Before starting the project, you will need to add the following environment variable in the .env file in the root folder of the project.

The .env already contains the following variables

```
VITE_MQTT_ENDPOINT=a2fr1lhmxa6xyh-ats.iot.us-east-1.amazonaws.com
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=
VITE_AWS_SECRET_ACCESS_KEY=
VITE_AWS_SESSION_TOKEN=
```

where `VITE_AWS_ACCESS_KEY_ID` and `VITE_AWS_SESSION_TOKEN` will need to be filled with the respective values.

## Usage
1. Start the Development Server
```bash
npm run dev
```

2. Open WebApp
```bash
http://localhost:5173/
```

3. Dashboard
You will see a dashboard with a home icon, connect button, and a light/dark mode button.

4. Click the `Connect` button, will initialise the connection to the MQTT and the timestream.

5. You can subscribe to any topic
	- **reactTest/status**: receives a message every 5 seconds.
	- **reactTest/vendEvents**: receives an event at an unpredictable time
	- **reactTest/freeVend**: Once `reactTest/freeVend`, and `reactTest/vendEvents` are both subcribed to, a drop-down will appear to send a message to `reactTest/freeVend` in which the message will be received at `reactTest/vendEvents`

6. Currently only the DC Graph of the Machine Status is shown, along with the prive of the vendEvents
