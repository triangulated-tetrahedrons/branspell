# branspell

![alt text](https://raw.githubusercontent.com/triangulated-tetrahedrons/branspell/master/demo/output.gif)

> Spelling test prepper made with electron-vue and AWS polly text-to-speech

#### Build Setup

To run this desktop application, you must have AWS CLI
credentials configured on your host device. The credentials
must be configured to allow polly:SynthesizeSpeech access as well

More about AWS CLI configuration:  
https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration 

More about setting up AWS permissions:  
https://aws.amazon.com/iam/features/manage-permissions/ 

``` bash
# Setup AWS credentials (credential must have polly:SynthesizeSpeech permissions)
aws configure
  AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
  AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  Default region name [None]: us-west-2
  Default output format [None]: json

# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build

# run unit & end-to-end tests
npm test


# lint all JS/Vue component files in `src/`
npm run lint

```

---

#### Using the app
Use the top right purple button to select the spelling test to run
spelling test files are in .yml format, and have content like:

``` yaml
data:
  - Joel created a [potato] using his magic wand.
  - I want to hang up this photo in [a picture frame].
  - Tyranny, like hell is not [easily conquered].
  - Yet we bear this in [consolation], that the
  - harder the conflict, the more [glorious] our triumph
```

The word(s) to be tested in each sentence has to be wrapped in [square brackets]

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
