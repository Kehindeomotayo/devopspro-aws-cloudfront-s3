'use strict';

document.querySelectorAll('.phase-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const phase = button.closest('.phase-card');
    if (!phase) return;

    document.querySelectorAll('.phase-card').forEach(card => {
      const isActive = card === phase ? !card.classList.contains('active') : false;
      card.classList.toggle('active', isActive);
      card.querySelector('.phase-toggle')?.setAttribute('aria-expanded', String(isActive));
    });
  });
});

const hbg = document.getElementById('hbg');
const mob = document.getElementById('mob-nav');

const closeMobileMenu = () => {
  hbg.classList.remove('open');
  mob.classList.remove('open');
  hbg.setAttribute('aria-expanded', 'false');
};

if (hbg && mob) {
  hbg.addEventListener('click', () => {
    const isOpen = hbg.classList.toggle('open');
    hbg.setAttribute('aria-expanded', String(isOpen));
    mob.classList.toggle('open', isOpen);
  });

  mob.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', closeMobileMenu));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mob.classList.contains('open')) {
      closeMobileMenu();
      hbg.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) closeMobileMenu();
  }, { passive: true });
}

const navAnchors = document.querySelectorAll('.nav-links a[href^="#"],.mob-nav a[href^="#"]');
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(anchor => {
      anchor.classList.toggle('active', anchor.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-38% 0px -55% 0px' });

const observedIds = new Set(
  [...navAnchors].map(anchor => anchor.getAttribute('href').slice(1))
);

observedIds.forEach(id => {
  const target = document.getElementById(id);
  if (target) spy.observe(target);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .08 });

document.querySelectorAll('.rv').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * .07}s`;
  revealObserver.observe(element);
});

const lab = document.getElementById('git-lab');
const accessForm = document.getElementById('lab-access-form');
const accessFeedback = document.getElementById('access-feedback');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalPath = document.getElementById('terminal-path');
const terminalPanel = document.querySelector('.terminal-panel');
const terminalHead = document.querySelector('.terminal-head');
const terminalActions = document.querySelector('.terminal-actions');
const choicePanel = document.getElementById('choice-panel');
const choiceTitle = document.getElementById('choice-title');
const choiceQuestion = document.getElementById('choice-question');
const choiceOptions = document.getElementById('choice-options');
const choiceFeedback = document.getElementById('choice-feedback');
const timerDisplay = document.getElementById('lab-timer');
const scoreDisplay = document.getElementById('lab-score');
const resetButton = document.getElementById('lab-reset');
const labIntro = document.getElementById('lab-intro');
const labStartButton = document.getElementById('lab-start');
let taskItems = document.querySelectorAll('#lab-tasks li[data-task]');
const maxFailedAttempts = 2;
const resultPanel = document.getElementById('result-panel');
const phaseGuideTitle = document.getElementById('phase-guide-title');
const phaseGuideMain = document.getElementById('phase-guide-main');
const phaseGuideNote = document.getElementById('phase-guide-note');
let activeLabId = 'git-1';

const optionQuestions = {
  dockersecurity: {
    title: 'Container Runtime Security',
    question: 'Why should application processes run as a non-root user inside a container?',
    options: [
      ['fasterBuilds', 'To make Docker image builds faster.'],
      ['leastPrivilege', 'To reduce privilege if the application inside the container is compromised.'],
      ['largerImages', 'To make the image include more system packages.'],
      ['portMapping', 'To make host port mapping work.'],
    ],
    correct: 'leastPrivilege',
    success: 'Correct. Running the app as a non-root user follows least privilege inside the container.',
  },
  bashext: {
    title: 'Bash Script File Type',
    question: 'Which file extension is normally used for a Bash script?',
    options: [
      ['txt', '.txt'],
      ['sh', '.sh'],
      ['jq', '.jq'],
      ['all', 'All of the above'],
    ],
    correct: 'sh',
    success: 'Correct. Bash scripts commonly use the .sh extension.',
  },
  execperm: {
    title: 'Script Execution Permission',
    question: 'Which permission is required to run a script directly?',
    options: [
      ['read', 'read'],
      ['write', 'write'],
      ['execute', 'execute'],
      ['all', 'All of the above'],
    ],
    correct: 'execute',
    success: 'Correct. Execute permission allows a script to run directly.',
  },
  editperm: {
    title: 'File Editing Permission',
    question: 'Which permission allows you to edit a file?',
    options: [
      ['read', 'read'],
      ['execute', 'execute'],
      ['all', 'All of the above'],
      ['write', 'write'],
    ],
    correct: 'write',
    success: 'Correct. Write permission allows file contents to be changed.',
  },
  tfq1: {
    title: 'Terraform Question 1',
    question: 'Terraform is often known as IaC. What does IaC mean?',
    options: [
      ['infrastructureAsCode', 'Infrastructure as Code.'],
      ['internetAccessControl', 'Internet Access Control.'],
      ['internalAppConfig', 'Internal Application Configuration.'],
      ['instanceAutoCompute', 'Instance Auto Compute.'],
    ],
    correct: 'infrastructureAsCode',
    success: 'Correct. IaC means Infrastructure as Code.',
  },
  tfq2: {
    title: 'Terraform Question 2',
    question: 'What is main.tf commonly used for in a Terraform project?',
    options: [
      ['secrets', 'Storing production passwords in plain text.'],
      ['resources', 'Defining the main infrastructure resources and module calls.'],
      ['stateOnly', 'Storing only the Terraform state file.'],
      ['logs', 'Collecting application logs from servers.'],
    ],
    correct: 'resources',
    success: 'Correct. main.tf usually holds the core resources and module calls.',
  },
  tfq3: {
    title: 'Terraform Question 3',
    question: 'What is variables.tf commonly used for?',
    options: [
      ['outputs', 'Printing only final output values.'],
      ['providers', 'Downloading provider plugins manually.'],
      ['inputs', 'Declaring input variables that make the configuration reusable.'],
      ['stateLock', 'Locking the state file.'],
    ],
    correct: 'inputs',
    success: 'Correct. variables.tf declares reusable input variables.',
  },
  tfq4: {
    title: 'Terraform Question 4',
    question: 'What is outputs.tf commonly used for?',
    options: [
      ['variableDefaults', 'Setting only variable defaults.'],
      ['providerAuth', 'Authenticating cloud providers.'],
      ['formatting', 'Formatting Terraform files.'],
      ['outputValues', 'Exposing selected created resource attributes, such as an instance public IP, load balancer DNS name, or bucket name.'],
    ],
    correct: 'outputValues',
    success: 'Correct. outputs.tf exposes selected resource attributes after Terraform creates or reads infrastructure.',
  },
  tfq5: {
    title: 'Terraform Question 5',
    question: 'What does a provider configuration define?',
    options: [
      ['pluginCloud', 'Which cloud platform or service Terraform talks to, such as AWS, Azure, or GCP.'],
      ['appCode', 'The frontend application source code.'],
      ['stateBackup', 'The previous state backup only.'],
      ['shellAlias', 'Local shell aliases for Terraform commands.'],
    ],
    correct: 'pluginCloud',
    success: 'Correct. Providers let Terraform manage a target platform or service.',
  },
  tfq6: {
    title: 'Terraform Question 6',
    question: 'What is local.tf commonly used for in Terraform?',
    options: [
      ['remoteSecrets', 'Storing remote secrets outside Terraform.'],
      ['computedValues', 'Keeping reusable configuration values for resources, such as names, tags, environment labels, or derived values.'],
      ['providerInstall', 'Installing Terraform providers from the CLI.'],
      ['stateHistory', 'Saving old state versions locally.'],
    ],
    correct: 'computedValues',
    success: 'Correct. local.tf commonly keeps reusable local values and derived values inside the Terraform configuration.',
  },
  tfq7: {
    title: 'Terraform Question 7',
    question: 'What is terraform.tfstate used for?',
    options: [
      ['sourceCode', 'Replacing main.tf as the source of truth.'],
      ['unitTests', 'Running unit tests for modules.'],
      ['mapping', 'Tracking the mapping between Terraform configuration and real infrastructure.'],
      ['providerDocs', 'Storing provider documentation.'],
    ],
    correct: 'mapping',
    success: 'Correct. State maps Terraform resources to real infrastructure objects.',
  },
  tfq8: {
    title: 'Terraform Question 8',
    question: 'What is terraform.tfstate.backup used for?',
    options: [
      ['providerCache', 'Caching provider downloads.'],
      ['envVars', 'Storing environment variable values.'],
      ['lockFile', 'Locking Terraform state during apply.'],
      ['previousState', 'Keeping a backup copy of the previous local state.'],
    ],
    correct: 'previousState',
    success: 'Correct. The backup file can preserve the previous local state version.',
  },
  tfq9: {
    title: 'Terraform Question 9',
    question: 'Why does Terraform use state locking?',
    options: [
      ['preventConcurrent', 'To block two users or automation jobs from changing the same state at the same time.'],
      ['speedUpPlan', 'To make terraform plan run without providers.'],
      ['hideOutputs', 'To hide output values from users.'],
      ['skipValidation', 'To skip syntax validation.'],
    ],
    correct: 'preventConcurrent',
    success: 'Correct. State locking blocks two users or automation jobs from writing to the same Terraform state at the same time.',
  },
  tfq10: {
    title: 'Terraform Question 10',
    question: 'Why use remote state such as an S3 backend?',
    options: [
      ['replaceGit', 'To replace Git as the version control system.'],
      ['sharedState', 'To store shared state centrally for teams and automation.'],
      ['runContainers', 'To run application containers from S3.'],
      ['formatCode', 'To format Terraform configuration files.'],
    ],
    correct: 'sharedState',
    success: 'Correct. Remote state gives teams and pipelines a shared state location.',
  },
  tfq11: {
    title: 'Terraform Question 11',
    question: 'What is terraform init used for?',
    options: [
      ['applyChanges', 'Creating all resources immediately.'],
      ['destroyAll', 'Destroying all managed resources.'],
      ['initWorkingDir', 'Initializing the working directory, backend, modules, and provider plugins.'],
      ['printOutputs', 'Printing only output values.'],
    ],
    correct: 'initWorkingDir',
    success: 'Correct. terraform init prepares the working directory.',
  },
  tfq12: {
    title: 'Terraform Question 12',
    question: 'What is terraform fmt used for?',
    options: [
      ['validateCloud', 'Checking AWS account permissions.'],
      ['showPlan', 'Showing resources that will change.'],
      ['lockState', 'Locking remote state.'],
      ['format', 'Rewriting Terraform configuration into standard formatting.'],
    ],
    correct: 'format',
    success: 'Correct. terraform fmt formats Terraform files.',
  },
  tfq13: {
    title: 'Terraform Question 13',
    question: 'What is terraform validate used for?',
    options: [
      ['syntax', 'Checking whether the configuration is syntactically valid and internally consistent.'],
      ['cost', 'Calculating exact cloud cost.'],
      ['deploy', 'Deploying infrastructure to production.'],
      ['unlock', 'Unlocking a remote state file.'],
    ],
    correct: 'syntax',
    success: 'Correct. terraform validate checks configuration validity.',
  },
  tfq14: {
    title: 'Terraform Question 14',
    question: 'What is terraform plan used for?',
    options: [
      ['preview', 'Previewing the actions Terraform intends to take before apply.'],
      ['formatOnly', 'Formatting files only.'],
      ['loginOnly', 'Logging in to Terraform Cloud only.'],
      ['backupOnly', 'Creating only a state backup.'],
    ],
    correct: 'preview',
    success: 'Correct. terraform plan previews proposed infrastructure changes.',
  },
  tfq15: {
    title: 'Terraform Question 15',
    question: 'What is terraform apply used for?',
    options: [
      ['previewOnly', 'Previewing changes without making them.'],
      ['execute', 'Executing the planned infrastructure changes.'],
      ['formatOnly', 'Formatting Terraform code.'],
      ['readOnly', 'Reading state without changing anything.'],
    ],
    correct: 'execute',
    success: 'Correct. terraform apply executes infrastructure changes.',
  },
  tfq16: {
    title: 'Terraform Question 16',
    question: 'What is a Terraform module used for?',
    options: [
      ['stateLockOnly', 'Locking state files only.'],
      ['shellScript', 'Replacing Bash scripts inside EC2 instances.'],
      ['reusable', 'Packaging reusable Terraform configuration.'],
      ['imageBuild', 'Building Docker images directly.'],
    ],
    correct: 'reusable',
    success: 'Correct. Modules package reusable infrastructure configuration.',
  },
  tfq17: {
    title: 'Terraform Question 17',
    question: 'Why use .tfvars files?',
    options: [
      ['resourceDefs', 'Defining all cloud resources.'],
      ['stateLocks', 'Locking Terraform state.'],
      ['providerCache', 'Caching provider binaries.'],
      ['envValues', 'Providing environment-specific variable values such as dev, stage, and prod.'],
    ],
    correct: 'envValues',
    success: 'Correct. .tfvars files are commonly used for environment-specific values.',
  },
  tfq18: {
    title: 'Terraform Question 18',
    question: 'Which command singles out resources that will be created from a Terraform plan?',
    options: [
      ['created', 'terraform plan --no-color | grep "will be created"'],
      ['destroyed', 'terraform plan --no-color | grep "will be destroyed"'],
      ['fmt', 'terraform fmt | grep "will be created"'],
      ['apply', 'terraform apply --no-color | grep "will be created"'],
    ],
    correct: 'created',
    success: 'Correct. Grepping no-color plan output can isolate created resources.',
  },
  tfq19: {
    title: 'Terraform Question 19',
    question: 'Which command singles out resources that will be destroyed from a Terraform plan?',
    options: [
      ['created', 'terraform plan --no-color | grep "will be created"'],
      ['destroyed', 'terraform plan --no-color | grep "will be destroyed"'],
      ['validate', 'terraform validate | grep "will be destroyed"'],
      ['state', 'terraform state list | grep "will be destroyed"'],
    ],
    correct: 'destroyed',
    success: 'Correct. The destroyed phrase can be filtered from no-color plan output.',
  },
  tfq20: {
    title: 'Terraform Question 20',
    question: 'Which command singles out resources that will be updated from a Terraform plan?',
    options: [
      ['created', 'terraform plan --no-color | grep "will be created"'],
      ['destroyed', 'terraform plan --no-color | grep "will be destroyed"'],
      ['updated', 'terraform plan --no-color | grep "will be updated"'],
      ['fmt', 'terraform fmt --check | grep "will be updated"'],
    ],
    correct: 'updated',
    success: 'Correct. Grep can filter updated resources from plan output.',
  },
  tfq21: {
    title: 'Terraform Question 21',
    question: 'Which command writes Terraform plan output to plan-output.txt while still displaying it?',
    options: [
      ['redirectOnly', 'terraform plan --no-color > plan-output.txt'],
      ['fmtTee', 'terraform fmt | tee plan-output.txt'],
      ['validateTee', 'terraform validate | tee plan-output.txt'],
      ['tee', 'terraform plan --no-color | tee plan-output.txt'],
    ],
    correct: 'tee',
    success: 'Correct. tee displays output and writes it to a file.',
  },
  tfq22: {
    title: 'Terraform Question 22',
    question: 'Which command applies only a targeted module without applying the full configuration?',
    options: [
      ['targetApply', 'terraform apply -target=module.network'],
      ['fullApply', 'terraform apply'],
      ['targetPlan', 'terraform plan -target=module.network'],
      ['moduleFmt', 'terraform fmt -target=module.network'],
    ],
    correct: 'targetApply',
    success: 'Correct. -target can limit apply to a specific resource or module.',
  },
  tfq23: {
    title: 'Terraform Question 23',
    question: 'Which command destroys only an S3 bucket resource from a larger Terraform configuration?',
    options: [
      ['fullDestroy', 'terraform destroy'],
      ['targetDestroy', 'terraform destroy -target=aws_s3_bucket.app_bucket'],
      ['rmState', 'terraform state rm aws_s3_bucket.app_bucket'],
      ['deletePlan', 'terraform plan -destroy aws_s3_bucket.app_bucket'],
    ],
    correct: 'targetDestroy',
    success: 'Correct. A targeted destroy can destroy only a selected resource.',
  },
  tfq24: {
    title: 'Terraform Question 24',
    question: 'What does drift mean when working with Terraform?',
    options: [
      ['formatChange', 'Terraform files were reformatted with terraform fmt.'],
      ['stateMismatch', 'Real infrastructure changed outside Terraform, so it no longer matches the Terraform state or configuration.'],
      ['providerInstall', 'Terraform downloaded a newer provider plugin during init.'],
      ['moduleReuse', 'A module is reused across multiple environments.'],
    ],
    correct: 'stateMismatch',
    success: 'Correct. Drift means real infrastructure has changed outside Terraform and no longer matches the expected state.',
  },
  tfq25: {
    title: 'Terraform Question 25',
    question: 'What is an attribute in Terraform?',
    options: [
      ['inputSetting', 'A value you set inside a resource block to configure the resource.'],
      ['stateLock', 'A lock that prevents two Terraform applies from running at once.'],
      ['exportedValue', 'A value exposed by a resource or data source after Terraform reads or creates it, such as id, arn, or public_ip.'],
      ['providerBinary', 'The downloaded provider executable inside .terraform.'],
    ],
    correct: 'exportedValue',
    success: 'Correct. Attributes are values exposed by resources or data sources, often used in references and outputs.',
  },
  tfq26: {
    title: 'Terraform Question 26',
    question: 'What is an argument in Terraform?',
    options: [
      ['stateBackup', 'A backup copy of the previous Terraform state.'],
      ['planResult', 'A line in the plan output showing a proposed action.'],
      ['driftChange', 'A manual infrastructure change made outside Terraform.'],
      ['configInput', 'A value you set in a block to configure a resource, provider, module, or data source.'],
    ],
    correct: 'configInput',
    success: 'Correct. Arguments are configuration inputs you set in Terraform blocks.',
  },
};

const phase1InitialState = {
  unlocked: false,
  cwd: '~',
  dirs: new Set(),
  files: new Set(),
  repoName: null,
  cloned: false,
  sshKeyGenerated: false,
  publicKeyViewed: false,
  tokenAuth: false,
  mainSynced: false,
  fetchedMain: false,
  stagedFiles: new Set(),
  skippedTasks: new Set(),
  committed: false,
  reverted: false,
  deepPath: 'devopspro-training-site/labs/git/github/onboarding/week1',
  createdNestedPath: null,
  previousCwd: null,
  branches: new Set(['main']),
  currentBranch: 'main',
  currentTaskIndex: 0,
  failedAttempts: 0,
  tasks: {
    sshkey: false,
    pubkey: false,
    clone: false,
    repo: false,
    remotecheck: false,
    pull: false,
    dev: false,
    stage: false,
    prod: false,
    branchcheck: false,
    feature: false,
    nested: false,
    stepback: false,
    cdprevious: false,
    pathfile: false,
    copyhome: false,
    home: false,
    backrepo: false,
    file: false,
    filecheck: false,
    copy: false,
    copycheck: false,
    move: false,
    movecheck: false,
    stagefile: false,
    commit: false,
    log: false,
    revert: false,
    push: false,
  },
  remaining: 20 * 60,
  timerId: null,
  finished: false,
};

const phase2InitialState = {
  ...phase1InitialState,
  cwd: 'devopspro-training-site',
  repoName: 'devopspro-training-site',
  cloned: true,
  fetchedMain: false,
  stagedFiles: new Set(),
  skippedTasks: new Set(),
  conflictActive: false,
  conflictResolved: false,
  stashCreated: false,
  stashPopped: false,
  commitAmended: false,
  publicCommitReverted: false,
  localCommitReset: false,
  rebaseMode: null,
  branches: new Set(['main', 'dev', 'feature/payment-webhook']),
  currentBranch: 'feature/payment-webhook',
  remaining: 15 * 60,
  tasks: {
    fetchmain: false,
    rebasetrue: false,
    rebasepull: false,
    conflictstatus: false,
    inspectconflict: false,
    resolveconflict: false,
    stageconflict: false,
    rebasecontinue: false,
    amend: false,
    safepush: false,
    rebasefalse: false,
    noffmerge: false,
    publicrevert: false,
    softreset: false,
    stash: false,
    stashpop: false,
  },
};

const linuxInitialState = {
  unlocked: false,
  cwd: '~',
  dirs: new Set(['projects', 'projects/app', 'projects/app/logs', 'projects/app/config', 'backups']),
  files: new Set(['projects/app/app.log', 'projects/app/config/app.conf']),
  stagedFiles: new Set(),
  skippedTasks: new Set(),
  branches: new Set(),
  users: new Set(['student']),
  groups: new Set(['sudo']),
  userGroups: { student: ['sudo'] },
  packages: new Set(),
  archiveCreated: false,
  extractedArchive: false,
  processRunning: true,
  processKilled: false,
  cronAdded: false,
  scriptCreated: false,
  scriptRan: false,
  currentUser: 'student',
  rootSession: false,
  remaining: 30 * 60,
  timerId: null,
  finished: false,
  currentTaskIndex: 0,
  failedAttempts: 0,
  tasks: {
    whoami: false,
    pwd: false,
    rootls: false,
    sudoaptupdate: false,
    sudoaptupgrade: false,
    installnginx: false,
    whichnginx: false,
    purgenginx: false,
    adduser: false,
    iduser: false,
    groupadd: false,
    usermod: false,
    homecheck: false,
    sudogrant: false,
    sudocheck: false,
    suroot: false,
    suuser: false,
    mkdir: false,
    touch: false,
    nano: false,
    vi: false,
    bashext: false,
    execperm: false,
    editperm: false,
    cprecursive: false,
    findfile: false,
    grep: false,
    chmod: false,
    chown: false,
    lsl: false,
    df: false,
    du: false,
    lscpu: false,
    lshw: false,
    zip: false,
    unzip: false,
    tarcreate: false,
    tarextract: false,
    curl: false,
    wget: false,
    ps: false,
    kill: false,
    top: false,
    crontab: false,
    help: false,
    man: false,
    type: false,
    echo: false,
    history: false,
    scriptfile: false,
    scriptrun: false,
    rmrf: false,
  },
};

const dockerInitialState = {
  unlocked: false,
  cwd: 'container-workshop',
  dirs: new Set(),
  files: new Set(['Dockerfile', 'index.html', 'style.css', 'script.js']),
  stagedFiles: new Set(),
  skippedTasks: new Set(),
  branches: new Set(),
  dockerGroupGranted: false,
  dockerSessionActive: false,
  dockerLoggedIn: false,
  nginxPulled: false,
  dockerfileFixed: false,
  imageBuilt: false,
  imageName: null,
  taggedImageName: null,
  imagePushed: false,
  containerCreated: false,
  containerStarted: false,
  containerName: null,
  containerPort: null,
  appCheckedUp: false,
  appCheckedDown: false,
  containerRemoved: false,
  imageRemoved: false,
  remaining: 20 * 60,
  timerId: null,
  finished: false,
  currentTaskIndex: 0,
  failedAttempts: 0,
  tasks: {
    dockercheck: false,
    dockersecurity: false,
    dockeruser: false,
    dockersession: false,
    dockerlogin: false,
    dockerpull: false,
    dockercontext: false,
    dockerfile: false,
    dockerfix: false,
    dockerbuild: false,
    dockerimages: false,
    dockerrun: false,
    dockerappcheck: false,
    dockerps: false,
    dockerlogs: false,
    dockerexec: false,
    dockerstop: false,
    dockerappdown: false,
    dockerstart: false,
    dockerstopagain: false,
    dockerrm: false,
    dockertag: false,
    dockerpush: false,
    dockerrmi: false,
  },
};

const terraformQuestionKeys = Array.from({ length: 26 }, (_, index) => `tfq${index + 1}`);

const terraformInitialState = {
  unlocked: false,
  cwd: 'terraform-workshop',
  dirs: new Set(),
  files: new Set(),
  stagedFiles: new Set(),
  skippedTasks: new Set(),
  branches: new Set(),
  remaining: 20 * 60,
  timerId: null,
  finished: false,
  currentTaskIndex: 0,
  failedAttempts: 0,
  tasks: Object.fromEntries(terraformQuestionKeys.map(key => [key, false])),
};

const labShells = {
  'git-1': {
    state: 'git-1',
    title: 'First Day Repository Onboarding',
    documentTitle: 'Git Lab 1 - DevOpsPro',
    metaTitle: 'Git Lab 1 of 2',
    workflow: 'Workflow: Repo Onboarding',
    kicker: 'Day-To-Day Work Task',
    workItem: 'DEVOPS-101',
    introTitle: 'Start Git Lab 1 repository onboarding.',
    introCopy: 'The timer begins when you start. You will complete SSH setup, clone the DevOpsPro Cohort repository, work through Linux file tasks, commit, push, inspect history, and revert once.',
    promptPath: '~',
    guideMain: 'You have just joined DevOpsPro Cohort as a DevOps engineer. You have been granted access to the DevOps Cohort repository. Generate SSH keys for authentication, clone the repository using one of the approved SSH URLs, and complete the day-to-day Git and Linux activities required for repository onboarding.<br><br><strong>GitHub SSH URL:</strong> <code class="code-block">git@github.com:devopspro-cohort/devopspro-training-site.git</code><strong>GitLab SSH URL:</strong> <code class="code-block">git@gitlab.com:devopspro-cohort/devopspro-training-site.git</code>',
    guideNote: 'The remote <code>main</code> branch already has changes from another engineer. Git Lab 2 covers conflict resolution, rebase, and behind-target-branch fixes.',
    tasks: [
      ['sshkey', 'Generate an SSH key for Git access.'],
      ['pubkey', 'Display the public key to add to GitHub/GitLab.'],
      ['clone', 'Clone DevOpsPro\'s `devopspro-training-site` repository using SSH.'],
      ['repo', 'Move into the cloned repo.'],
      ['remotecheck', 'Check the remote URL.'],
      ['pull', 'Pull the latest remote changes from `origin/main`.'],
      ['dev', 'Create branch `dev`.'],
      ['stage', 'Create branch `stage`.'],
      ['prod', 'Create branch `prod`.'],
      ['branchcheck', 'Check the environment branches.'],
      ['feature', 'Create `feature/onboarding` from `dev`.'],
      ['nested', 'Create and enter a five-level nested directory under `labs`.'],
      ['stepback', 'Move three directory levels back in one command.'],
      ['cdprevious', 'Return to the five-level nested directory you created under `labs` in one command.'],
      ['pathfile', 'Create `path-check.txt` in the current nested directory.'],
      ['copyhome', 'Copy `path-check.txt` into your home directory.'],
      ['home', 'Return to the home directory in one command.'],
      ['backrepo', 'Return to the `devopspro-training-site` repository.'],
      ['file', 'Create `deployment-notes.md`.'],
      ['filecheck', 'Check that `deployment-notes.md` exists.'],
      ['copy', 'Copy `deployment-notes.md` to `deployment-notes.bak`.'],
      ['copycheck', 'Check that the copied file exists.'],
      ['move', 'Move `deployment-notes.bak` into `docs/deployment-notes.bak`.'],
      ['movecheck', 'Check the `docs` directory after the move.'],
      ['stagefile', 'Stage `deployment-notes.md`.'],
      ['commit', 'Commit your staged file.'],
      ['push', 'Push `feature/onboarding`.'],
      ['log', 'Inspect commit history.'],
      ['revert', 'Revert your last commit.'],
    ],
  },
  'git-2': {
    state: 'git-2',
    title: 'Fix Git Issues',
    documentTitle: 'Git Lab 2 - DevOpsPro',
    metaTitle: 'Git Lab 2 of 2',
    workflow: 'Workflow: Conflict Recovery',
    kicker: 'Day-To-Day Git Incident',
    workItem: 'DEVOPS-202',
    introTitle: 'Start Git Lab 2 conflict recovery.',
    introCopy: 'The timer begins when you start. You will recover a behind feature branch, handle rebase and merge pull behavior, resolve a conflict, amend a commit, push safely, revert, soft reset, then use stash and stash pop.',
    promptPath: 'devopspro-training-site',
    guideMain: 'You are working on source branch <code>feature/payment-webhook</code>. Another engineer updated target branch <code>main</code>, so the source branch is now behind the target branch. Recover the branch, resolve the conflict, and push safely.',
    guideNote: 'This phase tests common Git problems one incident step at a time. The guide changes as the active requirement changes.',
    tasks: [
      ['fetchmain', 'Fetch the latest target branch from origin.'],
      ['rebasetrue', 'Configure pull behavior to use rebase.'],
      ['rebasepull', 'Rebase the feature branch onto `origin/main`.'],
      ['conflictstatus', 'Check the rebase conflict state.'],
      ['inspectconflict', 'Inspect the conflicted file.'],
      ['resolveconflict', 'Resolve the conflict in `app/config.yml`.'],
      ['stageconflict', 'Stage the resolved file.'],
      ['rebasecontinue', 'Continue the rebase.'],
      ['amend', 'Amend the latest feature commit.'],
      ['safepush', 'Push the rebased feature branch safely.'],
      ['rebasefalse', 'Configure pull behavior to use merge.'],
      ['noffmerge', 'Merge target branch `origin/main` into the feature branch with `--no-ff`.'],
      ['publicrevert', 'Revert a pushed/public commit safely.'],
      ['softreset', 'Undo the last local unpushed commit but keep changes staged.'],
      ['stash', 'Stash local work before switching context.'],
      ['stashpop', 'Restore the stashed work.'],
    ],
  },
  'linux-1': {
    state: 'linux-1',
    title: 'Linux System Operations',
    documentTitle: 'Linux Lab 1 - DevOpsPro',
    metaTitle: 'Linux Lab 1',
    workflow: 'Workflow: Ubuntu Administration',
    kicker: 'Day-To-Day Linux Work Task',
    workItem: 'LINUX-101',
    introTitle: 'Start Linux Lab 1 system operations.',
    introCopy: 'The timer begins when you start. You will practice common Ubuntu commands for users, groups, sudo, permissions, packages, processes, archives, search, remote downloads, cron, and shell scripting.',
    promptPath: '~',
    guideMain: 'You are supporting an Ubuntu workstation used by DevOpsPro Cohort engineers. Complete the day-to-day Linux administration tasks from the terminal.',
    guideNote: 'The simulator accepts safe versions of administrative commands. Destructive commands are graded only against fake lab paths.',
    tasks: [
      ['whoami', 'Check the current logged-in user.'],
      ['pwd', 'Check your current directory.'],
      ['rootls', 'List the root directory using an absolute path.'],
      ['sudoaptupdate', 'Update the package index with sudo.'],
      ['sudoaptupgrade', 'Run a package upgrade with sudo.'],
      ['installnginx', 'Install nginx with apt.'],
      ['whichnginx', 'Check where nginx is installed.'],
      ['purgenginx', 'Purge nginx from the system.'],
      ['adduser', 'Create user `deploy`.'],
      ['homecheck', 'Check `/home` for created users.'],
      ['iduser', 'Check the `deploy` user identity.'],
      ['groupadd', 'Create group `devops`.'],
      ['usermod', 'Add `deploy` to group `devops`.'],
      ['sudogrant', 'Grant `deploy` sudo permission.'],
      ['sudocheck', 'Check sudo access for `deploy`.'],
      ['suroot', 'Switch to the root user.'],
      ['suuser', 'Switch to the `deploy` user.'],
      ['mkdir', 'Create nested directory `projects/app/logs`.'],
      ['touch', 'Create file `projects/app/logs/app.log`.'],
      ['nano', 'Edit `projects/app/logs/app.log` with nano.'],
      ['vi', 'Edit `projects/app/config/app.conf` with vi.'],
      ['bashext', 'Which file extension is normally used for a Bash script: `.txt`, `.sh`, `.jq`, or all of the above?'],
      ['execperm', 'Which file permission is required to run a script directly: read, write, execute, or all of the above?'],
      ['editperm', 'Which file permission allows you to edit a file: read, write, or execute?'],
      ['scriptfile', 'Create a small Bash script for file manipulation.'],
      ['chmod', 'Set executable permission on `projects/app/deploy.sh`.'],
      ['scriptrun', 'Run the Bash script.'],
      ['cprecursive', 'Copy `projects` recursively to `backups/projects`.'],
      ['findfile', 'Find `app.log` under `projects`.'],
      ['grep', 'Search `ERROR` inside `projects/app/logs/app.log`.'],
      ['chown', 'Change ownership of `projects/app` to `deploy:devops`.'],
      ['lsl', 'Check file permissions with a long listing.'],
      ['df', 'Check filesystem space with human-readable output.'],
      ['du', 'Check directory size with human-readable output.'],
      ['lscpu', 'Check CPU information.'],
      ['lshw', 'Check hardware information briefly.'],
      ['zip', 'Create a zip archive of `projects`.'],
      ['unzip', 'Extract the zip archive.'],
      ['tarcreate', 'Create a tar.gz archive of `projects`.'],
      ['tarextract', 'Extract the tar.gz archive.'],
      ['curl', 'Check a URL with curl.'],
      ['wget', 'Download a URL with wget.'],
      ['top', 'Open top to inspect processes.'],
      ['ps', 'Find the running demo process.'],
      ['kill', 'Kill the running demo process.'],
      ['crontab', 'Schedule a cron job for the lab hour.'],
      ['help', 'Use command help for `ls`.'],
      ['man', 'Open the manual page for `find`.'],
      ['type', 'Check how Bash resolves `echo`.'],
      ['echo', 'Write text into a file with echo.'],
      ['history', 'Show shell command history.'],
      ['rmrf', 'Remove the temporary extracted directory recursively.'],
    ],
  },
  'docker-1': {
    state: 'docker-1',
    title: 'Docker Container Operations',
    documentTitle: 'Docker Lab 1 - DevOpsPro',
    metaTitle: 'Docker Lab 1',
    workflow: 'Workflow: Image And Container Operations',
    kicker: 'Day-To-Day Docker Work Task',
    workItem: 'DOCKER-101',
    introTitle: 'Start Docker Lab 1 image and container operations.',
    introCopy: 'The timer begins when you start. You will prepare Docker for a non-root user, log in, pull a public image, build a frontend app image, run a web container, verify the app URL, inspect it, enter it, stop/start it, tag and push the image, then clean up.',
    promptPath: 'container-workshop',
    guideMain: 'You are containerising a DevOpsPro frontend app. Complete the Docker workflow from the terminal as a non-root user, then prove the app is reachable through the mapped host URL.',
    guideNote: 'Use terminal commands for command tasks. Use the option panel for knowledge checks. The simulator validates intent and state without touching the host Docker daemon.',
    tasks: [
      ['dockercheck', 'Check that Docker is available on the workstation.'],
      ['dockersecurity', 'Why should application processes run as a non-root user inside a container?'],
      ['dockeruser', 'Allow the `student` user to run Docker without using root.'],
      ['dockersession', 'Activate the updated Docker group membership for the current shell.'],
      ['dockerlogin', 'Log in to Docker as user `student`.'],
      ['dockerpull', 'Pull the public `nginx` image from Docker Hub.'],
      ['dockercontext', 'Check the frontend build context files.'],
      ['dockerfile', 'Inspect the frontend app Dockerfile before building the image.'],
      ['dockerfix', 'Fix the incorrect `COPY` instruction in the Dockerfile.'],
      ['dockerbuild', 'Build the frontend app Docker image from the current directory and tag it with your own image name.'],
      ['dockerimages', 'List local Docker images.'],
      ['dockerrun', 'Run the image as a detached container with your own container name and host port mapped to container port 80.'],
      ['dockerappcheck', 'Access the frontend app through the mapped host URL.'],
      ['dockerps', 'List all containers.'],
      ['dockerlogs', 'Check logs for your container.'],
      ['dockerexec', 'Open an interactive shell inside your container.'],
      ['dockerstop', 'Stop your running container.'],
      ['dockerappdown', 'Check whether the frontend app is still reachable after the container is stopped.'],
      ['dockerstart', 'Start your stopped container.'],
      ['dockerstopagain', 'Stop your restarted container.'],
      ['dockerrm', 'Remove your container.'],
      ['dockertag', 'Tag your frontend image as `student/devopspro-frontend:v1`.'],
      ['dockerpush', 'Push `student/devopspro-frontend:v1` to the registry.'],
      ['dockerrmi', 'Remove your Docker image.'],
    ],
  },
  'terraform-1': {
    state: 'terraform-1',
    title: 'Terraform Fundamentals',
    documentTitle: 'Terraform Lab 1 - DevOpsPro',
    metaTitle: 'Terraform Lab 1',
    workflow: 'Workflow: Infrastructure As Code',
    kicker: 'Day-To-Day Terraform Knowledge Check',
    workItem: 'TERRAFORM-101',
    introTitle: 'Start Terraform Lab 1 fundamentals.',
    introCopy: 'The timer begins when you start. This is an option-based Terraform test covering IaC, file responsibilities, state, remote backends, core commands, modules, tfvars, plan filtering, tee output, and targeted operations.',
    promptPath: 'terraform-workshop',
    guideMain: 'You are reviewing Terraform fundamentals for DevOpsPro Cohort infrastructure work. Select the best answer for each question. Option questions allow one attempt.',
    guideNote: 'This lab is option-based. The terminal is hidden while questions are active.',
    tasks: terraformQuestionKeys.map((key, index) => [key, `${index + 1}. ${optionQuestions[key].question}`]),
  },
};

function activeInitialState() {
  if (activeLabId === 'terraform-1') return terraformInitialState;
  if (activeLabId === 'docker-1') return dockerInitialState;
  if (activeLabId === 'linux-1') return linuxInitialState;
  if (activeLabId === 'git-2' || lab?.dataset.phase === '2') return phase2InitialState;
  return phase1InitialState;
}

activeLabId = getActiveLabId();
configureLabShell(activeLabId);
taskItems = document.querySelectorAll('#lab-tasks li[data-task]');
let labState = cloneLabState(activeInitialState());

function cloneLabState(source) {
  return {
    ...source,
    dirs: new Set(source.dirs),
    files: new Set(source.files),
    stagedFiles: new Set(source.stagedFiles),
    skippedTasks: new Set(source.skippedTasks),
    branches: new Set(source.branches),
    previousCwd: source.previousCwd || null,
    users: new Set(source.users || []),
    groups: new Set(source.groups || []),
    packages: new Set(source.packages || []),
    userGroups: source.userGroups ? Object.fromEntries(Object.entries(source.userGroups).map(([user, groups]) => [user, [...groups]])) : {},
    tasks: { ...source.tasks },
    timerId: null,
  };
}

function getActiveLabId() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lab');
  if (requested && labShells?.[requested]) return requested;
  if (lab?.dataset.lab) return lab.dataset.lab;
  if (lab?.dataset.phase === '2') return 'git-2';
  if (lab) return 'git-1';
  return 'git-1';
}

function configureLabShell(labId) {
  const config = labShells[labId];
  if (!lab || !config) return;
  lab.dataset.lab = labId;
  lab.dataset.phase = labId === 'git-2' ? '2' : labId === 'linux-1' ? 'linux' : labId === 'docker-1' ? 'docker' : labId === 'terraform-1' ? 'terraform' : '1';
  document.title = config.documentTitle;
  setText('lab-meta-title', config.metaTitle);
  setText('lab-meta-workflow', config.workflow);
  setText('lab-kicker', config.kicker);
  setText('terminal-title', config.title);
  setText('lab-work-item', config.workItem);
  setText('lab-intro-title', config.introTitle);
  setText('lab-intro-copy', config.introCopy);
  setText('terminal-path', config.promptPath);
  setText('terminal-head-user', `student@ubuntu:${config.promptPath}`);
  if (scoreDisplay) scoreDisplay.textContent = `0/${config.tasks.length} passed`;
  if (timerDisplay) {
    const initial = config.state === 'terraform-1' ? terraformInitialState.remaining : config.state === 'linux-1' ? linuxInitialState.remaining : config.state === 'docker-1' ? dockerInitialState.remaining : config.state === 'git-2' ? phase2InitialState.remaining : phase1InitialState.remaining;
    timerDisplay.textContent = `${String(Math.floor(initial / 60)).padStart(2, '0')}:${String(initial % 60).padStart(2, '0')}`;
  }
  const list = document.getElementById('lab-tasks');
  if (list) {
    list.innerHTML = config.tasks.map(([key, text]) => `<li data-task="${key}">${text}</li>`).join('');
  }
  if (phaseGuideMain) phaseGuideMain.innerHTML = config.guideMain;
  if (phaseGuideNote) phaseGuideNote.innerHTML = config.guideNote;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function appendTerminal(message, className = '') {
  if (!terminalOutput) return;
  const line = document.createElement('p');
  if (className) line.className = className;
  line.textContent = message;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function updateLabUi() {
  if (!lab || !terminalInput || !terminalPath || !scoreDisplay || !timerDisplay) return;

  lab.dataset.locked = String(!labState.unlocked);
  terminalInput.disabled = !labState.unlocked || labState.finished;
  terminalPath.textContent = labState.cwd;

  const total = Object.keys(labState.tasks).length;
  const passed = Object.values(labState.tasks).filter(Boolean).length;
  const skipped = labState.skippedTasks.size;
  const failed = skipped;
  const completed = passed + failed;
  if (failed) {
    scoreDisplay.textContent = `${passed} passed / ${failed} failed`;
  } else {
    scoreDisplay.textContent = `${passed}/${total} passed`;
  }
  scoreDisplay.classList.toggle('complete', completed === total && failed === 0);

  const minutes = String(Math.floor(labState.remaining / 60)).padStart(2, '0');
  const seconds = String(labState.remaining % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  timerDisplay.classList.toggle('warning', labState.remaining <= 120 && labState.remaining > 30);
  timerDisplay.classList.toggle('danger', labState.remaining <= 30);

  taskItems.forEach(item => {
    const task = item.dataset.task;
    item.classList.toggle('done', Boolean(labState.tasks[task]));
    item.classList.toggle('current', task === currentTaskKey());
    item.classList.toggle('skipped', labState.skippedTasks.has(task));
  });
  updatePhaseGuide();
  renderChoiceMode();
}

function isOptionTask(key = currentTaskKey()) {
  return Boolean(key && optionQuestions[key]);
}

function renderChoiceMode() {
  if (!terminalPanel || !choicePanel || !choiceTitle || !choiceQuestion || !choiceOptions || !choiceFeedback) return;
  const key = currentTaskKey();
  const optionQuestion = optionQuestions[key];
  const showChoice = labState.unlocked && !labState.finished && Boolean(optionQuestion);

  terminalPanel.classList.toggle('choice-mode', showChoice);
  terminalHead?.classList.toggle('lab-hidden', showChoice);
  terminalOutput?.classList.toggle('lab-hidden', showChoice);
  terminalForm?.classList.toggle('lab-hidden', showChoice);
  terminalActions?.classList.toggle('lab-hidden', showChoice);
  choicePanel.classList.toggle('lab-hidden', !showChoice);
  if (!showChoice) {
    choicePanel.dataset.choiceTask = '';
    choiceOptions.innerHTML = '';
    choiceFeedback.textContent = '';
    choiceFeedback.className = 'choice-feedback';
    return;
  }

  if (choicePanel.dataset.choiceTask === key && choiceOptions.children.length) return;
  choicePanel.dataset.choiceTask = key;
  choiceTitle.textContent = optionQuestion.title;
  choiceQuestion.textContent = optionQuestion.question;
  choiceFeedback.textContent = '';
  choiceFeedback.className = 'choice-feedback';
  choiceOptions.innerHTML = optionQuestion.options.map(([value, label], index) => {
    const letter = String.fromCharCode(65 + index);
    return `<div class="choice-row"><button class="choice-option" type="button" data-choice="${value}" aria-label="Option ${letter}: ${label}"><span class="choice-label"><strong>Option ${letter}:</strong> ${label}</span><span class="choice-radio" aria-hidden="true"></span></button></div>`;
  }).join('\n');
}

function scrollCurrentTaskIntoView() {
  const current = document.querySelector('#lab-tasks li.current');
  const pane = current?.closest('.requirements-pane');
  if (!current || !pane) return;
  const currentIndex = taskOrder().indexOf(current.dataset.task);
  if (currentIndex <= 3) {
    pane.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const header = pane.querySelector('h4');
  const paneRect = pane.getBoundingClientRect();
  const currentRect = current.getBoundingClientRect();
  const headerOffset = (header?.offsetHeight || 0) + 8;
  const previousContext = Math.min(current.offsetTop, current.offsetHeight * 2 + 16);
  const targetTop = paneRect.top + headerOffset + previousContext;
  pane.scrollBy({ top: currentRect.top - targetTop, behavior: 'smooth' });
}

function startLabTimer() {
  stopLabTimer();
  labState.timerId = window.setInterval(() => {
    labState.remaining -= 1;
    if (labState.remaining <= 0) {
      labState.remaining = 0;
      stopLabTimer();
      finishLabOnTimeout();
    }
    updateLabUi();
  }, 1000);
}

function stopLabTimer() {
  if (labState.timerId) {
    window.clearInterval(labState.timerId);
    labState.timerId = null;
  }
}

function unlockLab() {
  labState.unlocked = true;
  labState.finished = false;
  terminalOutput.innerHTML = '';
  appendTerminal('Lab unlocked. Your timer has started.', 'ok');
  appendTerminal('Work item DEVOPS-101: clone DevOpsPro Cohort devopspro-training-site, update the default branch, create environment branches, work from dev, practice Linux navigation, change files, inspect history, revert once, and push feature work.');
  appendTerminal('Generate an SSH key and display the public key before cloning with an SSH URL.', 'hint');
  appendTerminal('The remote main branch already contains new changes. Pull before creating feature/onboarding from dev.', 'hint');
  appendTerminal('Type commands yourself. Paste is blocked for this exercise.', 'hint');
  startLabTimer();
  updateLabUi();
  announceCurrentRequirement();
  focusActiveInput();
}

function openTestingLab() {
  labState.unlocked = true;
  labState.finished = false;
  lab?.classList.remove('lab-hidden');
  labIntro?.classList.add('lab-hidden');
  terminalOutput.innerHTML = '';
  appendTerminal('Practice lab started. Complete the work request shown in the left panel.', 'ok');
  appendTerminal(activeLabId === 'linux-1'
    ? 'You are on an Ubuntu workstation. Complete each Linux administration task one requirement at a time.'
    : activeLabId === 'docker-1'
    ? 'You are on an Ubuntu workstation with Docker installed. Complete each Docker task one requirement at a time.'
    : activeLabId === 'terraform-1'
    ? 'This is an option-based Terraform knowledge lab. Select the best answer for each requirement.'
    : activeLabId === 'git-2'
    ? 'A teammate updated main and your feature branch is behind the target branch. Resolve the Git workflow one requirement at a time.'
    : 'Use the terminal to create the expected final state. Progress is graded automatically.', 'hint');
  appendTerminal('Paste is disabled. Type commands manually.', 'hint');
  startLabTimer();
  updateLabUi();
  announceCurrentRequirement();
  focusActiveInput();
}

function focusActiveInput() {
  if (isOptionTask()) {
    return;
  }
  terminalInput?.focus({ preventScroll: true });
}

function resetLab() {
  const wasUnlocked = labState.unlocked;
  stopLabTimer();
  labState = cloneLabState(activeInitialState());
  terminalOutput.innerHTML = '';
  if (wasUnlocked) {
    labState.unlocked = true;
    appendTerminal('Lab restarted. Your timer has started again.', 'ok');
    appendTerminal('Type each command manually. Paste remains disabled.', 'hint');
    startLabTimer();
  } else {
    appendTerminal('Access is not active. Start or unlock the lab, then type each command yourself. Paste is disabled for this exercise.');
  }
  updateLabUi();
  if (wasUnlocked) terminalInput.focus({ preventScroll: true });
}

function completeIfReady() {
  const order = taskOrder();
  const completed = order.every(task => labState.tasks[task] || labState.skippedTasks.has(task));
  if (!completed) return;
  labState.finished = true;
  stopLabTimer();
  if (labState.skippedTasks.size) {
    finishLab('failed', `Lab completed with ${labState.skippedTasks.size} failed requirement${labState.skippedTasks.size === 1 ? '' : 's'}.`);
  } else {
    finishLab('passed', `Lab passed. You completed the ${labWorkflowName()} workflow.`);
  }
}

function finishLabOnTimeout() {
  if (labState.finished) return;
  const order = taskOrder();
  order.forEach(task => {
    if (!labState.tasks[task]) labState.skippedTasks.add(task);
  });
  finishLab('failed', 'Time is up.');
}

function finalScore(status, message) {
  const order = taskOrder();
  const total = order.length;
  const passed = Object.values(labState.tasks).filter(Boolean).length;
  const failed = order.filter(task => labState.skippedTasks.has(task)).length;
  return {
    status,
    message,
    labId: activeLabId,
    phase: activeLabId === 'git-2' ? '2' : activeLabId === 'linux-1' ? 'linux-1' : activeLabId === 'docker-1' ? 'docker-1' : activeLabId === 'terraform-1' ? 'terraform-1' : '1',
    labName: labDisplayName(),
    workflow: labWorkflowName(),
    passed,
    failed,
    total,
    completedAt: new Date().toISOString(),
  };
}

function labWorkflowName() {
  if (activeLabId === 'linux-1') return 'Linux system operations';
  if (activeLabId === 'docker-1') return 'Docker container operations';
  if (activeLabId === 'terraform-1') return 'Terraform fundamentals';
  return activeLabId === 'git-2' ? 'Phase 2 conflict recovery' : 'Phase 1 repository onboarding';
}

function labDisplayName(labId = activeLabId) {
  if (labId === 'git-1') return 'Git Lab 1';
  if (labId === 'git-2') return 'Git Lab 2';
  if (labId === 'linux-1') return 'Linux Lab 1';
  if (labId === 'docker-1') return 'Docker Lab 1';
  if (labId === 'terraform-1') return 'Terraform Lab 1';
  return 'Practice Lab';
}

function finishLab(status, message) {
  labState.finished = true;
  stopLabTimer();
  const result = finalScore(status, message);
  window.localStorage?.setItem('devopsLabResult', JSON.stringify(result));
  appendTerminal(`${message} Final score: ${result.passed} passed, ${result.failed} failed, ${result.total} total.`, status === 'passed' ? 'ok' : 'err');
  window.setTimeout(() => {
    window.location.href = 'result.html';
  }, 700);
}

function taskOrder() {
  return [...taskItems].map(item => item.dataset.task);
}

function currentTaskKey() {
  return taskOrder()[labState.currentTaskIndex] || null;
}

function updatePhaseGuide() {
  const key = currentTaskKey();
  const order = taskOrder();
  const questionNumber = Math.max(1, order.indexOf(key) + 1);
  if (!phaseGuideTitle) return;
  if (activeLabId !== 'git-2' && activeLabId !== 'linux-1' && activeLabId !== 'docker-1' && activeLabId !== 'terraform-1') {
    phaseGuideTitle.textContent = `Question ${questionNumber} of ${order.length}: Work Request Guide`;
    return;
  }
  if (!phaseGuideMain || !phaseGuideNote) return;
  if (isOptionTask(key)) {
    phaseGuideTitle.textContent = 'Knowledge Check';
    phaseGuideMain.innerHTML = '';
    phaseGuideNote.innerHTML = '';
    return;
  }
  const guide = activeLabId === 'linux-1' ? linuxGuideFor(key) : activeLabId === 'docker-1' ? dockerGuideFor(key) : activeLabId === 'terraform-1' ? terraformGuideFor(key) : (phase2Guides[key] || phase2Guides.default);
  phaseGuideTitle.textContent = `Question ${questionNumber} of ${order.length}: ${guide.title}`;
  phaseGuideMain.innerHTML = guide.main;
  phaseGuideNote.innerHTML = guide.note;
}

const phase2Guides = {
  default: {
    title: 'Work Request Guide',
    main: 'You are working on source branch <code>feature/payment-webhook</code>. Another engineer updated target branch <code>main</code>, so the source branch is now behind the target branch.',
    note: 'Work through the active incident step. Previous requirements are locked after they pass or fail.',
  },
  fetchmain: {
    title: 'Work Request Guide: Update Remote Tracking',
    main: 'You are on source branch <code>feature/payment-webhook</code>. The pull request target branch is <code>main</code>, and another engineer has added new commits there. Start by fetching from <code>origin</code> so your workstation has the latest <code>origin/main</code> before deciding how to update your feature branch.',
    note: 'Fetching updates remote-tracking refs like <code>origin/main</code>. It does not rewrite your working branch by itself, and it is the right first action before rebase or merge recovery.',
  },
  rebasetrue: {
    title: 'Work Request Guide: Rebase Pull Behavior',
    main: 'Your feature branch has local DevOps commits, and <code>origin/main</code> now has newer frontend work. Configure pull behavior so Git replays your local commits on top of the updated target branch instead of creating an extra local merge commit.',
    note: 'Many teams prefer <code>pull.rebase true</code> for feature branches because it keeps local history linear before the PR is merged in GitHub or GitLab.',
  },
  rebasepull: {
    title: 'Work Request Guide: Replay Feature Work',
    main: 'Now apply the rebase workflow. Bring <code>feature/payment-webhook</code> on top of <code>origin/main</code> so the source branch is no longer behind the target branch.',
    note: 'A rebase can stop on conflicts. When that happens, inspect the conflict, edit the file, stage it, then continue the rebase.',
  },
  conflictstatus: {
    title: 'Work Request Guide: Conflict State',
    main: 'The rebase stopped because the same file was changed in both histories. Check the repository state to see which file Git needs you to resolve.',
    note: 'Use status during incidents to identify unmerged paths and the next Git instruction.',
  },
  inspectconflict: {
    title: 'Work Request Guide: Inspect Conflict',
    main: 'Before editing, open the conflicted file and inspect the conflict markers. You need to understand both sides before choosing the final content.',
    note: 'Conflict markers usually show current target-side content, incoming feature-side content, and the commit being replayed.',
  },
  resolveconflict: {
    title: 'Work Request Guide: Resolve File',
    main: 'Edit <code>app/config.yml</code> and remove the conflict markers. Keep the final configuration that should exist after both engineers’ changes are reconciled.',
    note: 'In this simulator, opening the file in an editor represents resolving the conflict.',
  },
  stageconflict: {
    title: 'Work Request Guide: Mark Conflict Resolved',
    main: 'After editing the conflicted file, stage it so Git knows the conflict has been resolved.',
    note: 'During rebase or merge conflict recovery, staging the fixed file is how you tell Git the file is ready.',
  },
  rebasecontinue: {
    title: 'Work Request Guide: Continue Rebase',
    main: 'The conflict file has been resolved and staged. Continue the rebase so Git can finish replaying the feature commit.',
    note: 'If another conflict appears in real life, repeat inspect, edit, stage, and continue.',
  },
  stash: {
    title: 'Work Request Guide: Save Local Work',
    main: 'After undoing the local unpushed commit, you now have staged changes that may need to wait while you switch context. Save the current local work without creating another commit.',
    note: 'Stash is useful when your working tree is dirty and you need to switch branches or pause work quickly.',
  },
  stashpop: {
    title: 'Work Request Guide: Restore Local Work',
    main: 'The context switch is done. Restore the saved local changes back to the working tree so the feature branch can continue.',
    note: 'Popping a stash applies it and removes it from the stash list when successful.',
  },
  amend: {
    title: 'Work Request Guide: Amend Commit',
    main: 'The latest feature commit needs a small correction before it is pushed. Amend the latest commit instead of creating a noisy extra commit.',
    note: 'Amending rewrites the latest local commit. Avoid amending commits that teammates already depend on.',
  },
  safepush: {
    title: 'Work Request Guide: Safe Push After Rebase',
    main: 'Because the feature branch history was rewritten by rebase and amend, push with protection against overwriting someone else’s newer remote work.',
    note: 'Use <code>--force-with-lease</code> after rewriting your own feature branch history. Avoid plain <code>--force</code> in team repos.',
  },
  rebasefalse: {
    title: 'Work Request Guide: Merge Pull Behavior',
    main: 'Contrast question: now show the merge-pull behavior. If <code>pull.rebase</code> is false, Git pulls by merging the remote changes into your current branch instead of replaying your local commits.',
    note: 'This can create a local merge commit before the PR merge. It is useful to understand, but many organizations prefer <code>pull.rebase true</code> on feature branches to avoid extra merge commits.',
  },
  noffmerge: {
    title: 'Work Request Guide: Explicit Merge Commit',
    main: 'You are on source branch <code>feature/payment-webhook</code>. Demonstrate merge behavior by creating an explicit merge commit from the updated target branch into your feature branch.',
    note: 'Use <code>git merge --no-ff origin/main</code> or <code>git merge --no-ff main</code>. <code>--no-ff</code> belongs to merge, not commit.',
  },
  publicrevert: {
    title: 'Work Request Guide: Revert Public Commit',
    main: 'A bad commit has already been pushed publicly. The incident commit is <code>a1b2c3d</code>. Undo that pushed commit without rewriting shared history.',
    note: 'Use <code>git revert a1b2c3d</code>. You may inspect history with <code>git log</code>; it does not count as an answer attempt for this requirement.',
  },
  softreset: {
    title: 'Work Request Guide: Undo Local Commit',
    main: 'A final local commit has not been pushed yet. Undo the commit but keep its changes staged for correction.',
    note: 'Use soft reset only for local/unpushed commits when you want to keep the changes in the index.',
  },
};

function linuxGuideFor(key) {
  const task = labShells['linux-1'].tasks.find(([taskKey]) => taskKey === key)?.[1] || 'Complete the active Linux operation.';
  const guides = {
    whoami: ['Work Request Guide: Confirm Login Context', 'Before making system changes, confirm which user is currently operating in the shell.'],
    rootls: ['Work Request Guide: Absolute Paths', 'Use an absolute path from the filesystem root to inspect top-level directories.'],
    sudoaptupdate: ['Work Request Guide: Sudo Package Maintenance', 'Package index updates require elevated privilege on Ubuntu. Use sudo for the administrative command.'],
    adduser: ['Work Request Guide: User Administration', 'Create a service-style user account named <code>deploy</code> for application operations.'],
    usermod: ['Work Request Guide: Group Membership', 'Add the deploy user to the devops group without replacing any existing memberships.'],
    sudocheck: ['Work Request Guide: Sudo Permission Check', 'Check whether deploy can use sudo without actually changing system state.'],
    cprecursive: ['Work Request Guide: Recursive Copy', 'When copying a directory tree, use recursive copy so nested directories and files come across.'],
    rmrf: ['Work Request Guide: Recursive Removal', 'Remove only the temporary extracted lab directory. In real work, verify the path before using recursive force removal.'],
    crontab: ['Work Request Guide: Scheduled Work', 'Add a cron entry that runs during the current lab hour. This tests minute, hour, command, and crontab editing basics.'],
    scriptfile: ['Work Request Guide: Bash Script Creation', 'Create a small shell script that performs file and directory manipulation in one repeatable command.'],
    bashext: ['Work Request Guide: Bash Script File Type', 'Answer the interview-style check about the usual file extension used for Bash scripts.'],
    execperm: ['Work Request Guide: Script Execution Permission', 'Answer the permission check for running a script directly from the shell.'],
    editperm: ['Work Request Guide: File Editing Permission', 'Answer the permission check for changing file contents.'],
  };
  const [title, main] = guides[key] || ['Work Request Guide: Linux Operations', task];
  return {
    title,
    main,
    note: isOptionTask(key) ? 'Select the best answer from the option panel.' : 'Use terminal commands for this requirement. The simulator checks the intent and final state without touching the real host system.',
  };
}

function dockerGuideFor(key) {
  const task = labShells['docker-1'].tasks.find(([taskKey]) => taskKey === key)?.[1] || 'Complete the active Docker operation.';
  const guides = {
    dockersecurity: ['Work Request Guide: Container Runtime Security', 'Answer the container security question before changing host Docker access. In production images, application processes should avoid running as root inside the container so a compromised app has less privilege.'],
    dockeruser: ['Work Request Guide: Non-Root Docker Access', 'Docker is installed, but the student user needs permission to run Docker commands without switching to root. Add the user to the right group.'],
    dockersession: ['Work Request Guide: Refresh Group Membership', 'After changing group membership, activate the new Docker group in the current shell session before continuing.'],
    dockerlogin: ['Work Request Guide: Registry Authentication', 'Log in as the student user before building and pushing workflows. This lab only simulates authentication.'],
    dockerpull: ['Work Request Guide: Pull Public Image', 'Before building your own image, pull the public <code>nginx</code> image to confirm the workstation can download images from a registry.'],
    dockercontext: ['Work Request Guide: Build Context', 'Before reading the Dockerfile, check the frontend build context so you know which files are actually available to copy.<br><br><strong>Expected frontend directory content:</strong><br><code class="code-block">Dockerfile<br>index.html<br>style.css<br>script.js</code>'],
    dockerfile: ['Work Request Guide: Inspect Dockerfile', 'Inspect the Dockerfile and compare its <code>COPY</code> instruction against the frontend build context. The image uses <code>/app</code> as the working directory, then copies the app files into nginx’s web root. One copied source file is wrong and must be fixed before the image can build.'],
    dockerfix: ['Work Request Guide: Fix Dockerfile', 'The Dockerfile has an incorrect <code>COPY</code> instruction for one frontend file. Edit the Dockerfile so the listed frontend files are copied into <code>/app</code>.'],
    dockerbuild: ['Work Request Guide: Build Image', 'Build the current directory into a Docker image and choose a practical image tag.'],
    dockerrun: ['Work Request Guide: Run Web Container', 'Run the image in detached mode, give the container a name, and map a host port to container port 80.'],
    dockerappcheck: ['Work Request Guide: Verify Frontend URL', 'After running the container, access the frontend app through the host port you mapped to container port 80.'],
    dockerexec: ['Work Request Guide: Enter Container', 'Open an interactive shell inside the running container so you can inspect it from within.'],
    dockerappdown: ['Work Request Guide: Verify Stop Behavior', 'After stopping the container, check the same frontend URL again and confirm the app is no longer reachable.'],
    dockertag: ['Work Request Guide: Tag Image For Registry', 'After removing the container, tag the frontend image with the registry-style name <code>student/devopspro-frontend:v1</code> so it can be pushed.'],
    dockerpush: ['Work Request Guide: Push Image', 'Push the tagged image to the registry. In real work, this makes the image available to CI/CD, Kubernetes, ECS, or another deployment platform.'],
    dockerrmi: ['Work Request Guide: Clean Image', 'After removing the container, remove the local image to clean up the workstation.'],
  };
  const [title, main] = guides[key] || ['Work Request Guide: Docker Operations', task];
  return {
    title,
    main,
    note: isOptionTask(key) ? 'Select the best answer from the option panel.' : 'Use terminal commands for this requirement. The simulator checks Docker workflow state without calling the host Docker daemon.',
  };
}

function terraformGuideFor(key) {
  const question = optionQuestions[key];
  return {
    title: question?.title || 'Terraform Question',
    main: question?.question || 'Select the best Terraform answer.',
    note: 'Select one answer. Option questions allow one attempt.',
  };
}

function advanceCompletedTasks() {
  const order = taskOrder();
  while (labState.currentTaskIndex < order.length && labState.tasks[order[labState.currentTaskIndex]]) {
    labState.currentTaskIndex += 1;
    labState.failedAttempts = 0;
  }
}

function enforceLinearProgress(beforeTasks, command) {
  const order = taskOrder();
  const activeTask = order[labState.currentTaskIndex];
  if (!activeTask) return;

  order.forEach((task, index) => {
    if (index !== labState.currentTaskIndex && !beforeTasks[task]) {
      labState.tasks[task] = false;
    }
    if (labState.skippedTasks.has(task)) labState.tasks[task] = false;
  });

  if (labState.tasks[activeTask] && !beforeTasks[activeTask]) {
    advanceCompletedTasks();
    return;
  }

  if (isSupportCommand(command)) return;

  labState.failedAttempts += 1;
  const attemptsLeft = maxFailedAttempts - labState.failedAttempts;
  if (attemptsLeft > 0) {
    appendTerminal(`Attempt ${labState.failedAttempts}/${maxFailedAttempts} for the current requirement. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`, 'err');
    return;
  }

  labState.skippedTasks.add(activeTask);
  labState.tasks[activeTask] = false;
  labState.currentTaskIndex += 1;
  skipDependentCheck(activeTask);
  labState.failedAttempts = 0;
  appendTerminal('Two failed attempts reached. Moving to the next requirement; previous requirements are locked.', 'err');
  advanceCompletedTasks();
  updateLabUi();
  scrollCurrentTaskIntoView();
  announceCurrentRequirement();
  completeIfReady();
}

function failCurrentRequirement(messageSink) {
  const order = taskOrder();
  const activeTask = order[labState.currentTaskIndex];
  if (!activeTask) return;
  labState.skippedTasks.add(activeTask);
  labState.tasks[activeTask] = false;
  labState.currentTaskIndex += 1;
  skipDependentCheck(activeTask);
  labState.failedAttempts = 0;
  advanceCompletedTasks();
  updateLabUi();
  scrollCurrentTaskIntoView();
  announceCurrentRequirement();
  completeIfReady();
  if (messageSink) messageSink('Two failed attempts reached. Moving to the next requirement; previous requirements are locked.', 'err');
}

function handleChoiceSelection(button) {
  const key = currentTaskKey();
  const question = optionQuestions[key];
  if (!question || !button || labState.finished || !labState.unlocked) return;

  const selected = button.dataset.choice;
  const buttons = [...choiceOptions.querySelectorAll('.choice-option')];
  if (selected === question.correct) {
    button.classList.add('correct');
    labState.tasks[key] = true;
    labState.failedAttempts = 0;
    choiceFeedback.textContent = question.success;
    choiceFeedback.className = 'choice-feedback ok';
    window.setTimeout(() => {
      advanceCompletedTasks();
      updateLabUi();
      scrollCurrentTaskIntoView();
      announceCurrentRequirement();
      completeIfReady();
      focusActiveInput();
    }, 450);
    return;
  }

  button.classList.add('incorrect');
  buttons.forEach(option => { option.disabled = true; });
  choiceFeedback.textContent = 'Incorrect. Option questions allow one attempt. Moving to the next requirement.';
  choiceFeedback.className = 'choice-feedback err';
  window.setTimeout(() => {
    failCurrentRequirement();
    focusActiveInput();
  }, 650);
}

function skipDependentCheck(task) {
  if (activeLabId !== 'git-1') {
    return;
  }
  const dependentChecks = {
    file: 'filecheck',
    copy: 'copycheck',
    move: 'movecheck',
  };
  const dependent = dependentChecks[task];
  if (!dependent || labState.tasks[dependent]) return;
  labState.skippedTasks.add(dependent);
  const order = taskOrder();
  while (labState.currentTaskIndex < order.length && labState.skippedTasks.has(order[labState.currentTaskIndex])) {
    labState.currentTaskIndex += 1;
  }
}

function announceCurrentRequirement() {
  const current = document.querySelector('#lab-tasks li.current');
  if (!current) return;
  if (isOptionTask(current.dataset.task)) return;
  appendTerminal(`Current requirement: ${current.textContent.trim()}`, 'hint');
}

function isSupportCommand(command) {
  if (activeLabId === 'linux-1') {
    return /^(pwd|clear|ls(?:\s+(?:-[a-z]+\s+)?[a-z0-9._/-]+)?|whoami|id(?:\s+\w+)?|history)$/i.test(command);
  }
  if (activeLabId === 'docker-1') {
    return /^(pwd|clear|docker\s+(?:--version|version|info|ps(?:\s+-a)?|images))$/i.test(command);
  }
  if (activeLabId === 'terraform-1') {
    return /^(pwd|clear)$/i.test(command);
  }
  if (activeLabId === 'git-2') {
    if (/^git\s+log(?:\s+--oneline)?$/i.test(command) && currentTaskKey() === 'publicrevert') return true;
    return /^(pwd|clear)$/i.test(command);
  }
  if (currentTaskKey() === 'nested') {
    const nestedMkdir = command.match(/^mkdir\s+-p\s+([a-z0-9._/-]+)$/i);
    if (nestedMkdir) {
      if (isRootPath(nestedMkdir[1])) return false;
      return isFiveLevelLabsPath(normalizeDirPath(nestedMkdir[1]));
    }
    if (/^mkdir\s+[a-z0-9._/-]+$/i.test(command)) return false;
  }
  return /^(pwd|clear|ls(?:\s+[~a-z0-9._/-]+)?|cd(?:\s+.+)?|mkdir(?:\s+-p)?\s+[a-z0-9._/-]+|git\s+status|git\s+(?:switch|checkout)\s+[a-z0-9._/-]+|git\s+branch|git\s+remote\s+-v)$/i.test(command);
}

function repoFromCloneUrl(command) {
  const match = command.match(/^git\s+clone\s+(\S+)/i);
  if (!match) return null;

  const url = match[1];
  const isSupportedHost = /(github\.com|gitlab\.com)/i.test(url);
  if (!isSupportedHost) return null;

  const repoPart = url.split('/').pop() || url.split(':').pop();
  const repoName = repoPart.replace(/\.git$/i, '') || 'devopspro-training-site';
  return repoName === 'devopspro-training-site' ? repoName : null;
}

function processCommand(rawCommand) {
  const command = normalizeCommand(rawCommand);
  const lower = command.toLowerCase();

  if (!command) return '';
  appendTerminal(`student@ubuntu:${labState.cwd}$ ${command}`, 'cmd');

  if (activeLabId === 'linux-1') return processLinuxCommand(command, lower);
  if (activeLabId === 'docker-1') return processDockerCommand(command, lower);
  if (activeLabId === 'terraform-1') return 'Use the option panel for this Terraform lab.';
  if (activeLabId === 'git-2') return processPhase2Command(command, lower);

  if (lower === 'pwd') return `/home/student/${labState.cwd === '~' ? '' : labState.cwd}`.replace(/\/$/, '');
  const lsMatch = command.match(/^ls(?:\s+([a-z0-9._/-]+))?$/i);
  if (lsMatch) return listDirectory(lsMatch[1]);
  if (lower === 'git --version') return 'git version 2.43.0';
  if (lower === 'git help config' || lower === 'git config --help') {
    return 'Git config controls identity, pull strategy, remotes, and other repository preferences.';
  }
  if (lower === 'clear') {
    terminalOutput.innerHTML = '';
    return '';
  }

  const mkdirPMatch = command.match(/^mkdir\s+-p\s+([a-z0-9._/-]+)$/i);
  if (mkdirPMatch) {
    if (isRootPath(mkdirPMatch[1])) return `mkdir: cannot create directory '${mkdirPMatch[1]}': Permission denied`;
    const dir = normalizeDirPath(mkdirPMatch[1]);
    addDirectoryPath(dir);
    if (currentTaskKey() === 'nested' && !isFiveLevelLabsPath(dir)) {
      return `created directory path ${dir}, but this requirement expects a five-level path under labs`;
    }
    return `created directory path ${dir}`;
  }

  const mkdirMatch = command.match(/^mkdir\s+([a-z0-9._/-]+)$/i);
  if (mkdirMatch) {
    if (isRootPath(mkdirMatch[1])) return `mkdir: cannot create directory '${mkdirMatch[1]}': Permission denied`;
    const dir = normalizeDirPath(mkdirMatch[1]);
    const parent = dir.includes('/') ? dir.split('/').slice(0, -1).join('/') : '';
    if (parent && !labState.dirs.has(parent)) return `mkdir: cannot create directory '${mkdirMatch[1]}': No such file or directory`;
    labState.dirs.add(dir);
    if (currentTaskKey() === 'nested' && !isFiveLevelLabsPath(dir)) {
      return `created directory ${dir}, but this requirement expects a five-level path under labs`;
    }
    return `created directory ${dir}`;
  }

  const touchMatch = command.match(/^touch\s+([a-z0-9._/-]+)$/i);
  if (touchMatch) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before creating the work file';
    const file = normalizePath(touchMatch[1]);
    labState.files.add(file);
    if (file === 'deployment-notes.md') labState.tasks.file = true;
    if (currentTaskKey() === 'pathfile' && file.endsWith('/path-check.txt') && isFiveLevelLabsPath(labState.cwd)) labState.tasks.pathfile = true;
    return `created file ${file}`;
  }

  const cpMatch = command.match(/^cp\s+([~a-z0-9._/-]+)\s+([~a-z0-9._/-]+)$/i);
  if (cpMatch) return copyFile(normalizePath(cpMatch[1]), normalizePath(cpMatch[2]));

  const mvMatch = command.match(/^mv\s+([a-z0-9._/-]+)\s+([a-z0-9._/-]+)$/i);
  if (mvMatch) return moveFile(normalizePath(mvMatch[1]), normalizePath(mvMatch[2]));

  if (/^(gh|glab)\s+auth\s+login$/i.test(command)) return 'CLI token login noted. Phase 1 uses SSH access, so continue with SSH key setup.';

  if (/^ssh-keygen(?:\s+.*)?$/i.test(command)) {
    labState.sshKeyGenerated = true;
    labState.files.add('.ssh/id_ed25519');
    labState.files.add('.ssh/id_ed25519.pub');
    labState.tasks.sshkey = true;
    return 'SSH key pair generated: home-directory/.ssh/id_ed25519 and home-directory/.ssh/id_ed25519.pub';
  }

  if (/^(?:cat|less|more|head)\s+(?:~\/)?\.ssh\/id_(?:ed25519|rsa)\.pub$/i.test(command)) {
    if (!labState.sshKeyGenerated) return 'generate the SSH key before displaying the public key';
    labState.publicKeyViewed = true;
    labState.tasks.pubkey = true;
    return 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILabPublicKeyPreview student@example.com';
  }

  if (/^(?:~\/)?\.ssh\/id_(?:ed25519|rsa)\.pub$/i.test(command)) {
    return `bash: ${command}: Permission denied`;
  }

  if (/^git\s+config\s+--global\s+user\.(name|email)\s+.+/i.test(command)) {
    return 'global Git identity configured';
  }

  if (/^git\s+config\s+pull\.rebase\s+(true|false)$/i.test(command)) {
    const rebase = /true$/i.test(command);
    return rebase
      ? 'pull.rebase=true: future pulls replay your local commits on top of the fetched branch.'
      : 'pull.rebase=false: future pulls merge and may create a merge commit.';
  }

  const cdMatch = command.match(/^cd(?:\s+(.+))?$/i);
  if (cdMatch) return changeDirectory((cdMatch[1] || '~').trim());

  if (/^ssh\s+-T\s+git@(github\.com|gitlab\.com)$/i.test(command)) {
    if (!labState.sshKeyGenerated) return 'generate an SSH key first with ssh-keygen';
    return 'SSH test command accepted as optional practice. This lab grades key generation and clone workflow.';
  }

  const repoName = repoFromCloneUrl(command);
  if (repoName) {
    if (!labState.sshKeyGenerated) return 'generate an SSH key before cloning with an SSH URL';
    if (!labState.publicKeyViewed) return 'display the public key so it can be added to GitHub/GitLab before cloning';
    labState.repoName = repoName;
    labState.cloned = true;
    labState.dirs.add(repoName);
    labState.tasks.clone = true;
    return `cloned repository into ${repoName}`;
  }

  if (/^git\s+clone\s+/i.test(command)) {
    return 'use the DevOpsPro SSH base shown in the task and complete it with devopspro-training-site.git';
  }

  const branchCreated = createBranch(command);
  if (branchCreated) return branchCreated;

  if (/^git\s+remote\s+-v$/i.test(command)) {
    if (!labState.tasks.repo) return 'move into the cloned repository before checking remotes';
    labState.tasks.remotecheck = true;
    return `origin\tgit@github.com:devopspro-cohort/${labState.repoName}.git (fetch)\norigin\tgit@github.com:devopspro-cohort/${labState.repoName}.git (push)`;
  }

  const switchBranch = command.match(/^git\s+(?:switch|checkout)\s+([a-z0-9._/-]+)$/i);
  if (switchBranch) {
    const branch = switchBranch[1];
    if (!labState.tasks.repo) return 'clone the repository and cd into it before switching branches';
    if (!labState.branches.has(branch)) return `branch ${branch} does not exist yet`;
    labState.currentBranch = branch;
    return `switched to branch ${branch}`;
  }

  if (/^git\s+fetch\s+origin\s+main$/i.test(command)) {
    if (!labState.tasks.repo) return 'move into the cloned repository before fetching';
    labState.fetchedMain = true;
    return 'fetched origin/main. You can now rebase/merge, or use git pull origin main.';
  }

  if (/^git\s+pull(?:\s+--rebase)?\s+origin\s+(main|master)$/i.test(command)) {
    if (!labState.tasks.repo) return 'clone the repository and cd into it before pulling remote changes';
    labState.mainSynced = true;
    labState.tasks.pull = true;
    return `pulled latest remote changes from ${command.match(/origin\s+(main|master)$/i)[1]}`;
  }

  if (/^git\s+rebase\s+origin\/main$/i.test(command)) {
    if (!labState.fetchedMain) return 'fetch origin/main before rebasing onto it';
    labState.mainSynced = true;
    labState.tasks.pull = true;
    return 'rebased current branch onto origin/main';
  }

  if (/^git\s+merge\s+origin\/main$/i.test(command)) {
    if (!labState.fetchedMain) return 'fetch origin/main before merging it';
    labState.mainSynced = true;
    labState.tasks.pull = true;
    return 'merged origin/main into the current branch';
  }

  if (/^git\s+merge\s+--no-ff\s+[a-z0-9._/-]+$/i.test(command)) {
    return '--no-ff merge accepted. Use it when your team wants a visible merge commit for a feature branch.';
  }

  if (lower === 'git branch') {
    if (['dev', 'stage', 'prod'].every(branch => labState.branches.has(branch))) {
      labState.tasks.branchcheck = true;
    }
    return [...labState.branches].map(branch => branch === labState.currentBranch ? `* ${branch}` : `  ${branch}`).join('\n');
  }
  if (lower === 'git status') return gitStatus();
  if (/^git\s+log(?:\s+--oneline)?$/i.test(command)) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before reading Git history';
    labState.tasks.log = true;
    return labState.committed ? 'a1b2c3d Add deployment notes\n9f8e7d6 Update main from origin' : '9f8e7d6 Update main from origin';
  }

  const addMatch = command.match(/^git\s+add\s+(.+)$/i);
  if (addMatch) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before staging changes';
    if (!isAtRepoRoot()) return 'return to the repository root before staging deployment-notes.md';
    if (labState.currentBranch !== 'feature/onboarding') return 'switch to feature/onboarding before staging feature work';
    const target = addMatch[1].trim();
    if (target !== '.' && target !== '-A' && !labState.files.has(target)) return `${target} does not exist yet`;
    if (target === '.' || target === '-A') {
      labState.files.forEach(file => labState.stagedFiles.add(file));
    } else {
      labState.stagedFiles.add(target);
    }
    if (labState.stagedFiles.has('deployment-notes.md')) labState.tasks.stagefile = true;
    return 'changes staged';
  }

  if (/^git\s+commit\s+-m\s+["'][^"']+["']$/i.test(command)) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before committing';
    if (!labState.stagedFiles.has('deployment-notes.md')) return 'stage deployment-notes.md before committing';
    labState.committed = true;
    labState.tasks.commit = true;
    return 'created commit on feature/onboarding';
  }

  if (/^git\s+revert\s+(HEAD|[a-f0-9]{6,40})$/i.test(command)) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before reverting';
    if (!labState.committed) return 'create a commit before reverting it';
    labState.reverted = true;
    labState.tasks.revert = true;
    return 'created revert commit';
  }

  if (/^git\s+push(?:\s+(?:(?:-u|--set-upstream)\s+)?origin\s+feature\/onboarding)?$/i.test(command)) {
    if (!isInsideRepo()) return 'move back into devopspro-training-site before pushing';
    if (!labState.committed) return 'commit your file change before pushing';
    labState.tasks.push = true;
    completeIfReady();
    return 'pushed feature/onboarding to origin';
  }

  if (/^git\s+push\s+(?:(?:-u|--set-upstream)\s+)?origin\s+dev$/i.test(command)) {
    return 'dev exists, but this workplace task expects you to push feature/onboarding after syncing main.';
  }

  if (/^git\s+rebase\s+--continue$/i.test(command)) {
    return 'rebase continued. In a real conflict, resolve files, git add them, then run this.';
  }

  if (/^git\s+rebase\s+--skip$/i.test(command)) {
    return 'rebase skip noted. Use carefully because it drops the current replayed commit.';
  }

  if (/^git\s+push\s+--force-with-lease/i.test(command)) {
    return 'force-with-lease is the safer force push after rewriting a feature branch history.';
  }

  if (/^git\s+tag(\s|$)/i.test(command)) {
    return 'tag command accepted as reference. Tags are commonly used to trigger release/prod deployments.';
  }

  return 'Command recorded, but it does not complete a required lab step yet.';
}

function normalizeCommand(rawCommand) {
  return rawCommand
    .trim()
    .replace(/\s+/g, ' ');
}

function processLinuxCommand(command, lower) {
  const activeTask = currentTaskKey();

  if (lower === 'clear') {
    terminalOutput.innerHTML = '';
    return '';
  }

  if (lower === 'whoami') {
    if (activeTask === 'whoami') labState.tasks.whoami = true;
    return labState.rootSession ? 'root' : labState.currentUser;
  }

  if (lower === 'pwd') {
    if (activeTask === 'pwd') labState.tasks.pwd = true;
    return labState.cwd === '~' ? `/home/${labState.currentUser}` : `/home/${labState.currentUser}/${labState.cwd}`;
  }

  if (/^ls\s+\/$/i.test(command)) {
    if (activeTask !== 'rootls') return 'absolute root listing noted, but it is not the current Linux requirement';
    labState.tasks.rootls = true;
    return 'bin boot dev etc home lib opt proc root run sbin tmp usr var';
  }

  if (/^sudo\s+apt\s+update$/i.test(command)) {
    if (activeTask !== 'sudoaptupdate') return 'apt update is not the current Linux requirement';
    labState.tasks.sudoaptupdate = true;
    return 'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done';
  }

  if (/^sudo\s+apt\s+(?:upgrade|full-upgrade)(?:\s+-y)?$/i.test(command)) {
    if (activeTask !== 'sudoaptupgrade') return 'apt upgrade is not the current Linux requirement';
    if (!labState.tasks.sudoaptupdate) return 'run sudo apt update before upgrading packages';
    labState.tasks.sudoaptupgrade = true;
    return 'Calculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove.';
  }

  if (/^sudo\s+apt\s+install\s+(?:-y\s+)?nginx$/i.test(command)) {
    if (activeTask !== 'installnginx') return 'install nginx only when the active requirement asks for it';
    labState.packages.add('nginx');
    labState.tasks.installnginx = true;
    return 'nginx installed';
  }

  if (/^(?:which|whereis)\s+nginx$/i.test(command)) {
    if (activeTask !== 'whichnginx') return 'check nginx path only when the active requirement asks for it';
    if (!labState.packages.has('nginx')) return 'nginx is not installed yet';
    labState.tasks.whichnginx = true;
    return '/usr/sbin/nginx';
  }

  if (/^sudo\s+apt\s+(?:purge|remove\s+--purge)\s+(?:-y\s+)?nginx$/i.test(command)) {
    if (activeTask !== 'purgenginx') return 'purge nginx only when the active requirement asks for it';
    labState.packages.delete('nginx');
    labState.tasks.purgenginx = true;
    return 'nginx purged';
  }

  if (/^sudo\s+(?:adduser|useradd)(?:\s+-m)?\s+deploy$/i.test(command)) {
    if (activeTask !== 'adduser') return 'create deploy only when the active requirement asks for it';
    labState.users.add('deploy');
    labState.dirs.add('/home/deploy');
    labState.tasks.adduser = true;
    return 'created user deploy';
  }

  if (/^id\s+deploy$/i.test(command)) {
    if (activeTask !== 'iduser') return 'id deploy is not the current Linux requirement';
    if (!labState.users.has('deploy')) return 'id: deploy: no such user';
    labState.tasks.iduser = true;
    return `uid=1001(deploy) gid=1001(deploy) groups=1001(deploy)${(labState.userGroups.deploy || []).map(group => `,${group}`).join('')}`;
  }

  if (/^sudo\s+groupadd\s+devops$/i.test(command)) {
    if (activeTask !== 'groupadd') return 'create devops group only when the active requirement asks for it';
    labState.groups.add('devops');
    labState.tasks.groupadd = true;
    return 'created group devops';
  }

  if (/^sudo\s+usermod\s+-aG\s+devops\s+deploy$/i.test(command)) {
    if (activeTask !== 'usermod') return 'add deploy to devops only when the active requirement asks for it';
    if (!labState.users.has('deploy')) return 'create deploy before assigning groups';
    if (!labState.groups.has('devops')) return 'create devops group before assigning users';
    labState.userGroups.deploy = [...new Set([...(labState.userGroups.deploy || []), 'devops'])];
    labState.tasks.usermod = true;
    return 'deploy added to devops';
  }

  if (/^sudo\s+usermod\s+-aG\s+sudo\s+deploy$/i.test(command)) {
    if (activeTask !== 'sudogrant') return 'grant deploy sudo permission only when the active requirement asks for it';
    if (!labState.users.has('deploy')) return 'create deploy before granting sudo permission';
    labState.userGroups.deploy = [...new Set([...(labState.userGroups.deploy || []), 'sudo'])];
    labState.tasks.sudogrant = true;
    return 'deploy added to sudo';
  }

  if (/^ls\s+\/home\/?$/i.test(command)) {
    if (activeTask !== 'homecheck') return 'checking /home is useful, but it is not the current Linux requirement';
    labState.tasks.homecheck = true;
    return [...labState.users].join(' ');
  }

  if (/^sudo\s+-l\s+-U\s+deploy$/i.test(command)) {
    if (activeTask !== 'sudocheck') return 'sudo permission check is not the current Linux requirement';
    if (!(labState.userGroups.deploy || []).includes('sudo')) return 'grant deploy sudo permission before checking sudo access';
    labState.tasks.sudocheck = true;
    return 'User deploy may run the following commands on ubuntu:\n    (ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl';
  }

  if (/^(?:sudo\s+su\s+-|sudo\s+-i)$/i.test(command)) {
    if (activeTask !== 'suroot') return 'switch to root only when the active requirement asks for it';
    labState.rootSession = true;
    labState.currentUser = 'root';
    labState.cwd = '/root';
    labState.tasks.suroot = true;
    return 'switched to root';
  }

  if (/^su\s+-\s+deploy$/i.test(command)) {
    if (activeTask !== 'suuser') return 'switch to deploy only when the active requirement asks for it';
    labState.rootSession = false;
    labState.currentUser = 'deploy';
    labState.cwd = '~';
    labState.tasks.suuser = true;
    return 'switched to deploy';
  }

  if (/^mkdir\s+-p\s+projects\/app\/logs$/i.test(command)) {
    if (activeTask !== 'mkdir') return 'create the nested project directory only when asked';
    addLinuxDirectoryPath('projects/app/logs');
    labState.tasks.mkdir = true;
    return 'created projects/app/logs';
  }

  if (/^touch\s+projects\/app\/logs\/app\.log$/i.test(command)) {
    if (activeTask !== 'touch') return 'create app.log only when asked';
    labState.files.add('projects/app/logs/app.log');
    labState.tasks.touch = true;
    return 'created projects/app/logs/app.log';
  }

  if (/^nano\s+projects\/app\/logs\/app\.log$/i.test(command)) {
    if (activeTask !== 'nano') return 'use nano on app.log only when asked';
    labState.tasks.nano = true;
    return 'projects/app/logs/app.log edited with nano';
  }

  if (/^(?:vi|vim)\s+projects\/app\/config\/app\.conf$/i.test(command)) {
    if (activeTask !== 'vi') return 'use vi on app.conf only when asked';
    labState.tasks.vi = true;
    return 'projects/app/config/app.conf edited with vi';
  }

  if (/^cat\s+>\s+projects\/app\/deploy\.sh$/i.test(command) || /^nano\s+projects\/app\/deploy\.sh$/i.test(command) || /^vi\s+projects\/app\/deploy\.sh$/i.test(command)) {
    if (activeTask !== 'scriptfile') return 'create the Bash script only when asked';
    labState.files.add('projects/app/deploy.sh');
    labState.scriptCreated = true;
    labState.tasks.scriptfile = true;
    return 'created projects/app/deploy.sh with file manipulation commands';
  }

  if (/^chmod\s+(?:\+x|755)\s+projects\/app\/deploy\.sh$/i.test(command)) {
    if (activeTask !== 'chmod') return 'set script permissions only when asked';
    if (!labState.scriptCreated) return 'create projects/app/deploy.sh before changing its mode';
    labState.tasks.chmod = true;
    return 'mode updated for projects/app/deploy.sh';
  }

  if (/^(?:\.\/)?projects\/app\/deploy\.sh$/i.test(command) || /^bash\s+projects\/app\/deploy\.sh$/i.test(command)) {
    if (activeTask !== 'scriptrun') return 'run the script only when asked';
    if (!labState.tasks.chmod && !/^bash\s+/i.test(command)) return 'make the script executable before running it directly';
    labState.files.add('projects/app/output.txt');
    labState.scriptRan = true;
    labState.tasks.scriptrun = true;
    return 'script ran and updated projects/app/output.txt';
  }

  if (/^cp\s+-r\s+projects\s+backups\/projects$/i.test(command)) {
    if (activeTask !== 'cprecursive') return 'recursive copy is not the current Linux requirement';
    labState.dirs.add('backups/projects');
    labState.tasks.cprecursive = true;
    return 'copied projects recursively to backups/projects';
  }

  if (/^find\s+projects\s+-name\s+app\.log$/i.test(command)) {
    if (activeTask !== 'findfile') return 'find app.log only when asked';
    labState.tasks.findfile = true;
    return 'projects/app/logs/app.log';
  }

  if (/^grep\s+(?:-n\s+)?ERROR\s+projects\/app\/logs\/app\.log$/i.test(command)) {
    if (activeTask !== 'grep') return 'grep ERROR only when asked';
    labState.tasks.grep = true;
    return '1:ERROR simulated application failure';
  }

  if (/^sudo\s+chown\s+-R\s+deploy:devops\s+projects\/app$/i.test(command)) {
    if (activeTask !== 'chown') return 'ownership change is not the current Linux requirement';
    labState.tasks.chown = true;
    return 'ownership changed recursively to deploy:devops';
  }

  if (/^ls\s+-l\s+projects\/app(?:\/deploy\.sh)?$/i.test(command)) {
    if (activeTask !== 'lsl') return 'long listing is not the current Linux requirement';
    labState.tasks.lsl = true;
    return '-rwxr-xr-x 1 deploy devops 82 Aug 06 09:00 deploy.sh';
  }

  if (/^df\s+-h$/i.test(command)) {
    if (activeTask !== 'df') return 'df -h is not the current Linux requirement';
    labState.tasks.df = true;
    return 'Filesystem Size Used Avail Use% Mounted on\n/dev/root 30G 11G 19G 37% /';
  }

  if (/^du\s+-h\s+projects(?:\s+--max-depth=1)?$/i.test(command) || /^du\s+-sh\s+projects$/i.test(command)) {
    if (activeTask !== 'du') return 'du -h is not the current Linux requirement';
    labState.tasks.du = true;
    return '4.0K projects/app\n8.0K projects';
  }

  if (lower === 'lscpu') {
    if (activeTask !== 'lscpu') return 'lscpu is not the current Linux requirement';
    labState.tasks.lscpu = true;
    return 'Architecture: x86_64\nCPU(s): 2';
  }

  if (/^sudo\s+lshw\s+(?:-short|-class\s+\w+)$/i.test(command)) {
    if (activeTask !== 'lshw') return 'lshw is not the current Linux requirement';
    labState.tasks.lshw = true;
    return 'H/W path Device Class Description\n/0 processor CPU\n/0/1 memory System memory';
  }

  if (/^zip\s+-r\s+projects\.zip\s+projects$/i.test(command)) {
    if (activeTask !== 'zip') return 'zip archive is not the current Linux requirement';
    labState.archiveCreated = true;
    labState.tasks.zip = true;
    return 'adding: projects/';
  }

  if (/^unzip\s+projects\.zip(?:\s+-d\s+unzipped-projects)?$/i.test(command)) {
    if (activeTask !== 'unzip') return 'unzip is not the current Linux requirement';
    if (!labState.archiveCreated) return 'create projects.zip before extracting it';
    labState.extractedArchive = true;
    labState.dirs.add('unzipped-projects');
    labState.tasks.unzip = true;
    return 'Archive: projects.zip\nextracting projects';
  }

  if (/^tar\s+-czf\s+projects\.tar\.gz\s+projects$/i.test(command)) {
    if (activeTask !== 'tarcreate') return 'tar creation is not the current Linux requirement';
    labState.files.add('projects.tar.gz');
    labState.tasks.tarcreate = true;
    return 'created projects.tar.gz';
  }

  if (/^tar\s+-xzf\s+projects\.tar\.gz(?:\s+-C\s+tar-output)?$/i.test(command)) {
    if (activeTask !== 'tarextract') return 'tar extraction is not the current Linux requirement';
    if (!labState.files.has('projects.tar.gz')) return 'create projects.tar.gz before extracting it';
    labState.dirs.add('tar-output');
    labState.tasks.tarextract = true;
    return 'extracted projects.tar.gz';
  }

  if (/^curl\s+(?:-I\s+)?https?:\/\/\S+$/i.test(command)) {
    if (activeTask !== 'curl') return 'curl is not the current Linux requirement';
    labState.tasks.curl = true;
    return 'HTTP/2 200';
  }

  if (/^wget\s+https?:\/\/\S+(?:\s+-O\s+\S+)?$/i.test(command)) {
    if (activeTask !== 'wget') return 'wget is not the current Linux requirement';
    labState.tasks.wget = true;
    return 'saved remote file';
  }

  if (/^ps\s+(?:aux|-ef)$/i.test(command)) {
    if (activeTask !== 'ps') return 'ps is not the current Linux requirement';
    labState.tasks.ps = true;
    return 'student 4242 0.0 0.1 demo-worker';
  }

  if (/^kill\s+(?:-9\s+)?4242$/i.test(command)) {
    if (activeTask !== 'kill') return 'kill the process only when asked';
    if (!labState.processRunning) return 'process 4242 is not running';
    labState.processRunning = false;
    labState.processKilled = true;
    labState.tasks.kill = true;
    return 'terminated process 4242';
  }

  if (lower === 'top') {
    if (activeTask !== 'top') return 'top is not the current Linux requirement';
    labState.tasks.top = true;
    return 'top opened. Press q to quit in a real terminal.';
  }

  if (/^(?:crontab\s+-e|echo\s+["']?\*\s+\d{1,2}\s+\*\s+\*\s+\*\s+.+["']?\s*\|\s*crontab\s+-)$/i.test(command)) {
    if (activeTask !== 'crontab') return 'cron scheduling is not the current Linux requirement';
    labState.cronAdded = true;
    labState.tasks.crontab = true;
    return 'cron entry installed for the lab hour. Cron runs every minute, not every second.';
  }

  if (/^ls\s+--help$/i.test(command)) {
    if (activeTask !== 'help') return 'ls --help is not the current Linux requirement';
    labState.tasks.help = true;
    return 'Usage: ls [OPTION]... [FILE]...';
  }

  if (/^man\s+find$/i.test(command)) {
    if (activeTask !== 'man') return 'man find is not the current Linux requirement';
    labState.tasks.man = true;
    return 'FIND(1) - search for files in a directory hierarchy';
  }

  if (/^type\s+echo$/i.test(command)) {
    if (activeTask !== 'type') return 'type echo is not the current Linux requirement';
    labState.tasks.type = true;
    return 'echo is a shell builtin';
  }

  if (/^echo\s+.+\s+>\s+projects\/app\/notes\.txt$/i.test(command)) {
    if (activeTask !== 'echo') return 'echo file write is not the current Linux requirement';
    labState.files.add('projects/app/notes.txt');
    labState.tasks.echo = true;
    return 'wrote projects/app/notes.txt';
  }

  if (lower === 'history') {
    if (activeTask === 'history') labState.tasks.history = true;
    return '1 whoami\n2 sudo apt update\n3 find projects -name app.log';
  }

  if (/^rm\s+-rf\s+(?:unzipped-projects|tar-output)$/i.test(command)) {
    if (activeTask !== 'rmrf') return 'recursive removal is not the current Linux requirement';
    labState.tasks.rmrf = true;
    completeIfReady();
    return 'removed temporary extracted directory';
  }

  return 'Command recorded, but it does not complete the current Linux requirement yet.';
}

function addLinuxDirectoryPath(path) {
  const parts = path.split('/').filter(Boolean);
  for (let index = 1; index <= parts.length; index += 1) {
    labState.dirs.add(parts.slice(0, index).join('/'));
  }
}

function processDockerCommand(command, lower) {
  const activeTask = currentTaskKey();

  if (lower === 'clear') {
    terminalOutput.innerHTML = '';
    return '';
  }

  if (lower === 'pwd') return `/home/student/${labState.cwd}`;

  if (/^docker\s+(?:--version|version)$/i.test(command)) {
    if (activeTask === 'dockercheck') labState.tasks.dockercheck = true;
    return 'Docker version 26.1.0, build lab';
  }

  if (/^docker\s+info$/i.test(command)) {
    if (activeTask === 'dockercheck') labState.tasks.dockercheck = true;
    return 'Client: Docker Engine\nServer: Docker Engine';
  }

  if (/^sudo\s+usermod\s+-aG\s+docker\s+student$/i.test(command)) {
    if (activeTask !== 'dockeruser') return 'configure non-root Docker access only when asked';
    labState.dockerGroupGranted = true;
    labState.tasks.dockeruser = true;
    return 'student added to docker group';
  }

  if (/^(?:newgrp\s+docker|su\s+-\s+student)$/i.test(command)) {
    if (activeTask !== 'dockersession') return 'refresh Docker group membership only when asked';
    if (!labState.dockerGroupGranted) return 'add student to the docker group before refreshing the session';
    labState.dockerSessionActive = true;
    labState.tasks.dockersession = true;
    return 'Docker group membership active in this shell';
  }

  if (/^docker\s+login\s+(?:-u\s+student|--username\s+student)?$/i.test(command)) {
    if (activeTask !== 'dockerlogin') return 'docker login is not the current Docker requirement';
    if (!labState.dockerSessionActive) return 'activate Docker group membership before logging in';
    labState.dockerLoggedIn = true;
    labState.tasks.dockerlogin = true;
    return 'Login Succeeded';
  }

  if (/^docker\s+pull\s+nginx(?::latest)?$/i.test(command)) {
    if (activeTask !== 'dockerpull') return 'pull nginx only when the active requirement asks for it';
    if (!labState.dockerLoggedIn) return 'log in to Docker before pulling images in this lab';
    labState.nginxPulled = true;
    labState.tasks.dockerpull = true;
    return 'latest: Pulling from library/nginx\nDigest: sha256:nginx-lab\nStatus: Downloaded newer image for nginx:latest\ndocker.io/library/nginx:latest';
  }

  if (/^ls(?:\s+-la?|\s+-al)?$/i.test(command)) {
    if (activeTask !== 'dockercontext') return 'check the frontend build context only when asked';
    labState.tasks.dockercontext = true;
    return 'Dockerfile  index.html  style.css  script.js';
  }

  if (/^(?:cat|less|more|head)\s+Dockerfile$/i.test(command)) {
    if (activeTask !== 'dockerfile') return 'inspect the Dockerfile only when the active requirement asks for it';
    if (!labState.tasks.dockercontext) return 'check the frontend build context before inspecting the Dockerfile';
    labState.tasks.dockerfile = true;
    return [
      'FROM nginx:alpine',
      'WORKDIR /app',
      'COPY index.html style.css scrip.js /app/',
      'RUN cp /app/index.html /app/style.css /app/script.js /usr/share/nginx/html/',
      'EXPOSE 80',
      'CMD ["nginx", "-g", "daemon off;"]',
    ].join('\n');
  }

  if (/^(?:(?:nano|vi|vim)\s+Dockerfile|sed\s+-i\s+['"]?s\/scrip\.js\/script\.js\/g?['"]?\s+Dockerfile|sed\s+-i\s+['"]?s\/COPY index\.html style\.css scrip\.js \/COPY index\.html style\.css script\.js \/?g?['"]?\s+Dockerfile)$/i.test(command)) {
    if (activeTask !== 'dockerfix') return 'fix the Dockerfile only when the active requirement asks for it';
    if (!labState.tasks.dockerfile) return 'inspect the Dockerfile before editing it';
    labState.dockerfileFixed = true;
    labState.tasks.dockerfix = true;
    return [
      'Dockerfile updated',
      'COPY index.html style.css scrip.js /app/ corrected to COPY index.html style.css script.js /app/',
    ].join('\n');
  }

  const buildMatch = command.match(/^docker\s+build\s+-t\s+([a-z0-9._/-]+)\s+\.$/i);
  if (buildMatch) {
    if (activeTask !== 'dockerbuild') return 'build the Docker image only when asked';
    if (!labState.dockerLoggedIn) return 'log in to Docker before building the image in this lab';
    if (!labState.tasks.dockerfile) return 'inspect the Dockerfile before building the image';
    if (!labState.dockerfileFixed) return 'fix the incorrect Dockerfile COPY instruction before building the image';
    labState.imageName = buildMatch[1];
    labState.imageBuilt = true;
    labState.tasks.dockerbuild = true;
    return `Successfully built ${labState.imageName}`;
  }

  if (/^docker\s+images$/i.test(command)) {
    if (activeTask !== 'dockerimages') return 'docker images is not the current Docker requirement';
    if (!labState.imageBuilt) return 'build an image before listing it';
    labState.tasks.dockerimages = true;
    const nginxRow = labState.nginxPulled ? '\nnginx latest n9x1234 just-now 70MB' : '';
    return `REPOSITORY TAG IMAGE ID CREATED SIZE\n${labState.imageName} latest d0c1234 just-now 23MB${nginxRow}`;
  }

  const runMatch = command.match(/^docker\s+run\s+-d\s+--name\s+([a-z0-9_.-]+)\s+-p\s+([0-9]{2,5}):80\s+([a-z0-9._/-]+)$/i);
  if (runMatch) {
    if (activeTask !== 'dockerrun') return 'run the Docker container only when asked';
    const [, containerName, port, imageName] = runMatch;
    if (!labState.imageBuilt || imageName !== labState.imageName) return 'run the image you built in the previous step';
    labState.containerName = containerName;
    labState.containerPort = port;
    labState.containerCreated = true;
    labState.containerStarted = true;
    labState.containerRemoved = false;
    labState.tasks.dockerrun = true;
    return `9fceb02d4a11\ncontainer ${containerName} running on host port ${port}\nFrontend URL: http://localhost:${port}`;
  }

  const appCheckMatch = command.match(/^curl\s+(?:-I\s+)?http:\/\/(?:localhost|127\.0\.0\.1):([0-9]{2,5})\/?$/i);
  if (appCheckMatch) {
    const [, port] = appCheckMatch;
    if (activeTask !== 'dockerappcheck' && activeTask !== 'dockerappdown') return 'frontend URL check is not the current Docker requirement';
    if (port !== labState.containerPort) return 'use the host port you mapped when running the container';
    if (activeTask === 'dockerappcheck') {
      if (!labState.containerStarted) return 'the container must be running before the frontend app can respond';
      labState.appCheckedUp = true;
      labState.tasks.dockerappcheck = true;
      return 'HTTP/1.1 200 OK\nDevOpsPro frontend app is reachable';
    }
    if (labState.containerStarted) return 'the app is still reachable because the container is running; stop the container first';
    labState.appCheckedDown = true;
    labState.tasks.dockerappdown = true;
    return 'curl: (7) Failed to connect to localhost port ' + port + ': Connection refused';
  }

  if (/^docker\s+ps\s+-a$/i.test(command)) {
    if (activeTask !== 'dockerps') return 'docker ps -a is not the current Docker requirement';
    if (!labState.containerCreated) return 'run a container before listing containers';
    labState.tasks.dockerps = true;
    return `CONTAINER ID IMAGE COMMAND STATUS PORTS NAMES\n9fceb02d4a11 ${labState.imageName} nginx ${labState.containerStarted ? 'Up' : 'Exited'} 0.0.0.0:${labState.containerPort}->80/tcp ${labState.containerName}`;
  }

  const logsMatch = command.match(/^docker\s+logs\s+([a-z0-9_.-]+)$/i);
  if (logsMatch) {
    if (activeTask !== 'dockerlogs') return 'docker logs is not the current Docker requirement';
    if (!matchesDockerContainer(logsMatch[1])) return 'use the container name or container id from docker ps -a';
    labState.tasks.dockerlogs = true;
    return 'nginx started\nserving static site on port 80';
  }

  const execMatch = command.match(/^docker\s+exec\s+-it\s+([a-z0-9_.-]+)\s+(?:\/bin\/bash|bash|\/bin\/sh|sh)$/i);
  if (execMatch) {
    if (activeTask !== 'dockerexec') return 'docker exec is not the current Docker requirement';
    if (!matchesDockerContainer(execMatch[1])) return 'use the running container name or container id';
    if (!labState.containerStarted) return 'start the container before entering it';
    labState.tasks.dockerexec = true;
    return `root@${labState.containerName}:/usr/share/nginx/html#`;
  }

  const stopMatch = command.match(/^docker\s+stop\s+([a-z0-9_.-]+)$/i);
  if (stopMatch) {
    if (activeTask !== 'dockerstop' && activeTask !== 'dockerstopagain') return 'docker stop is not the current Docker requirement';
    if (!matchesDockerContainer(stopMatch[1])) return 'use the container name or container id';
    if (!labState.containerStarted) return 'container is already stopped';
    labState.containerStarted = false;
    labState.tasks[activeTask] = true;
    return labState.containerName;
  }

  const startMatch = command.match(/^docker\s+start\s+([a-z0-9_.-]+)$/i);
  if (startMatch) {
    if (activeTask !== 'dockerstart') return 'docker start is not the current Docker requirement';
    if (!matchesDockerContainer(startMatch[1])) return 'use the container name or container id';
    labState.containerStarted = true;
    labState.tasks.dockerstart = true;
    return labState.containerName;
  }

  const rmMatch = command.match(/^docker\s+rm\s+([a-z0-9_.-]+)$/i);
  if (rmMatch) {
    if (activeTask !== 'dockerrm') return 'docker rm is not the current Docker requirement';
    if (!matchesDockerContainer(rmMatch[1])) return 'use the container name or container id';
    if (labState.containerStarted) return 'stop the container before removing it';
    labState.containerRemoved = true;
    labState.containerCreated = false;
    labState.tasks.dockerrm = true;
    return labState.containerName;
  }

  const tagMatch = command.match(/^docker\s+tag\s+([a-z0-9._/-]+)\s+(student\/devopspro-frontend:v1)$/i);
  if (tagMatch) {
    if (activeTask !== 'dockertag') return 'docker tag is not the current Docker requirement';
    if (!labState.containerRemoved) return 'remove the container before tagging the image for push';
    if (tagMatch[1] !== labState.imageName) return 'tag the frontend image you built earlier';
    labState.taggedImageName = tagMatch[2];
    labState.tasks.dockertag = true;
    return `${labState.imageName}:latest tagged as ${labState.taggedImageName}`;
  }

  const pushMatch = command.match(/^docker\s+push\s+(student\/devopspro-frontend:v1)$/i);
  if (pushMatch) {
    if (activeTask !== 'dockerpush') return 'docker push is not the current Docker requirement';
    if (pushMatch[1] !== labState.taggedImageName) return 'push the image tag created in the previous step';
    labState.imagePushed = true;
    labState.tasks.dockerpush = true;
    return `The push refers to repository [docker.io/${labState.taggedImageName}]\nv1: digest: sha256:frontend-lab size: 856`;
  }

  const rmiMatch = command.match(/^docker\s+rmi\s+(.+)$/i);
  if (rmiMatch) {
    if (activeTask !== 'dockerrmi') return 'docker rmi is not the current Docker requirement';
    if (!labState.imagePushed) return 'push the tagged image before removing local image references';
    const imagesToRemove = rmiMatch[1].trim().split(/\s+/);
    if (!imagesToRemove.includes(labState.imageName) && !imagesToRemove.includes(labState.taggedImageName)) return 'remove the image you built or the registry tag you created';
    labState.imageRemoved = true;
    labState.tasks.dockerrmi = true;
    completeIfReady();
    return imagesToRemove.map((image) => `Untagged: ${image}`).join('\n') + '\nDeleted: d0c1234';
  }

  return 'Command recorded, but it does not complete the current Docker requirement yet.';
}

function matchesDockerContainer(value) {
  return Boolean(labState.containerName && (value === labState.containerName || value === '9fceb02d4a11' || value.startsWith('9fceb')));
}

function processPhase2Command(command, lower) {
  const activeTask = currentTaskKey();
  if (lower === 'pwd') return `/home/student/${labState.cwd}`;
  if (lower === 'clear') {
    terminalOutput.innerHTML = '';
    return '';
  }
  if (lower === 'git branch') {
    return [...labState.branches].map(branch => branch === labState.currentBranch ? `* ${branch}` : `  ${branch}`).join('\n');
  }

  if (lower === 'git status') {
    if (activeTask === 'conflictstatus' && labState.conflictActive) {
      labState.tasks.conflictstatus = true;
      return 'interactive rebase in progress; onto origin/main\nUnmerged paths:\n  both modified: app/config.yml\nResolve conflicts, stage the file, then run git rebase --continue.';
    }
    return `On branch ${labState.currentBranch}\nnothing to commit, working tree clean`;
  }

  if (/^git\s+fetch\s+origin(?:\s+main)?$/i.test(command)) {
    if (activeTask !== 'fetchmain') return 'fetch is not the current Phase 2 requirement';
    labState.fetchedMain = true;
    labState.tasks.fetchmain = true;
    return 'fetched origin/main';
  }

  if (/^git\s+config\s+pull\.rebase\s+true$/i.test(command)) {
    if (activeTask !== 'rebasetrue') return 'pull.rebase true is not the current Phase 2 requirement';
    labState.rebaseMode = true;
    labState.tasks.rebasetrue = true;
    return 'pull.rebase=true configured';
  }

  if (/^git\s+(?:pull\s+--rebase\s+origin\s+main|rebase\s+origin\/main)$/i.test(command)) {
    if (activeTask !== 'rebasepull') return 'rebase origin/main is not the current Phase 2 requirement';
    if (!labState.fetchedMain) return 'fetch origin/main before rebasing your feature branch';
    if (labState.rebaseMode !== true) return 'set pull.rebase true before using the rebase workflow';
    labState.conflictActive = true;
    labState.tasks.rebasepull = true;
    return 'CONFLICT (content): Merge conflict in app/config.yml\nerror: could not apply 8c9d2a1 Add payment webhook config';
  }

  if (/^(?:cat|less|head)\s+app\/config\.yml$/i.test(command)) {
    if (activeTask !== 'inspectconflict') return 'inspect app/config.yml only when the active requirement asks you to inspect the conflicted file';
    if (!labState.conflictActive) return 'app/config.yml has no active conflict right now';
    labState.tasks.inspectconflict = true;
    return '<<<<<<< HEAD\nAPI_TIMEOUT=30\n=======\nAPI_TIMEOUT=45\nPAYMENT_WEBHOOK=true\n>>>>>>> 8c9d2a1 Add payment webhook config';
  }

  if (/^(?:nano|vim|vi)\s+app\/config\.yml$/i.test(command) || /^resolve\s+app\/config\.yml$/i.test(command)) {
    if (activeTask !== 'resolveconflict') return 'resolve app/config.yml only when the active requirement asks you to resolve the conflict';
    if (!labState.conflictActive) return 'there is no active conflict to resolve';
    labState.conflictResolved = true;
    labState.tasks.resolveconflict = true;
    return 'app/config.yml edited; conflict markers removed';
  }

  const phase2AddMatch = command.match(/^git\s+add\s+(.+)$/i);
  if (phase2AddMatch) {
    if (activeTask !== 'stageconflict') return 'stage app/config.yml only when the active requirement asks you to stage the resolved file';
    if (!labState.conflictResolved) return 'resolve app/config.yml before staging it';
    const target = phase2AddMatch[1].trim();
    const changedFiles = ['app/config.yml'];
    if (target === '.' || target === '-A') {
      if (changedFiles.length > 1) return `git add ${target} would stage extra files. Stage only app/config.yml for this requirement`;
    } else if (target !== 'app/config.yml') {
      return 'stage the resolved file with git add app/config.yml';
    }
    labState.stagedFiles.add('app/config.yml');
    labState.tasks.stageconflict = true;
    return 'resolved file staged';
  }

  if (/^git\s+rebase\s+--continue$/i.test(command)) {
    if (activeTask !== 'rebasecontinue') return 'continue the rebase only when the active requirement asks you to continue';
    if (!labState.stagedFiles.has('app/config.yml')) return 'stage the resolved conflict before continuing the rebase';
    labState.conflictActive = false;
    labState.tasks.rebasecontinue = true;
    return 'Successfully rebased and updated refs/heads/feature/payment-webhook.';
  }

  if (/^git\s+stash(?:\s+push)?(?:\s+-m\s+["'][^"']+["'])?$/i.test(command)) {
    if (activeTask !== 'stash') return 'stash only when the active requirement asks you to save local work';
    if (!labState.tasks.softreset) return 'complete the local soft reset before stashing follow-up work';
    labState.stashCreated = true;
    labState.tasks.stash = true;
    return 'Saved working directory and index state WIP on feature/payment-webhook';
  }

  if (/^git\s+stash\s+pop$/i.test(command)) {
    if (activeTask !== 'stashpop') return 'restore the stash only when the active requirement asks you to restore local work';
    if (!labState.stashCreated) return 'create a stash before popping it';
    labState.stashPopped = true;
    labState.tasks.stashpop = true;
    return 'Dropped refs/stash@{0}; restored local changes';
  }

  if (/^git\s+commit\s+--amend(?:\s+(?:--no-edit|-m\s+["'][^"']+["']))?$/i.test(command)) {
    if (activeTask !== 'amend') return 'amend only when the active requirement asks you to amend the latest commit';
    labState.commitAmended = true;
    labState.tasks.amend = true;
    return 'amended latest feature commit';
  }

  if (/^git\s+push\s+(?:--force-with-lease\s+origin\s+feature\/payment-webhook|origin\s+feature\/payment-webhook\s+--force-with-lease)$/i.test(command)) {
    if (activeTask !== 'safepush') return 'safe push only when the active requirement asks you to push the rebased feature branch';
    if (!labState.tasks.rebasecontinue) return 'finish the rebase before pushing rewritten feature history';
    if (!labState.commitAmended) return 'amend the latest feature commit before the safe push';
    labState.tasks.safepush = true;
    return 'pushed feature/payment-webhook with --force-with-lease';
  }

  if (/^git\s+config\s+pull\.rebase\s+false$/i.test(command)) {
    if (activeTask !== 'rebasefalse') return 'pull.rebase false is not the current Phase 2 requirement';
    labState.rebaseMode = false;
    labState.tasks.rebasefalse = true;
    return 'pull.rebase=false configured; future pulls use merge behavior unless overridden';
  }

  if (/^git\s+merge\s+--no-ff\s+(?:origin\/main|main)$/i.test(command)) {
    if (activeTask !== 'noffmerge') return '--no-ff merge is not the current Phase 2 requirement';
    if (!labState.tasks.rebasefalse) return 'set pull.rebase false before demonstrating the merge workflow';
    labState.tasks.noffmerge = true;
    return 'Merge made by the recursive strategy. Explicit merge commit created with --no-ff from the target branch into feature/payment-webhook.\nNext public incident commit to revert: a1b2c3d';
  }

  if (/^git\s+log(?:\s+--oneline)?$/i.test(command)) {
    if (activeTask !== 'publicrevert') return 'git log is useful here, but it is not the current Phase 2 requirement';
    return 'a1b2c3d Bad payment webhook config\n7e6f5a4 Merge origin/main into feature/payment-webhook\n8c9d2a1 Add payment webhook config';
  }

  if (/^git\s+revert\s+[a-f0-9]{6,40}$/i.test(command)) {
    if (activeTask !== 'publicrevert') return 'revert only when the active requirement asks you to revert a pushed/public commit';
    if (!labState.tasks.noffmerge) return 'complete the merge workflow before the public revert task';
    labState.publicCommitReverted = true;
    labState.tasks.publicrevert = true;
    return 'created a new revert commit for the pushed/public commit';
  }

  if (/^git\s+revert\s+\S+$/i.test(command)) {
    if (activeTask !== 'publicrevert') return 'revert only when the active requirement asks you to revert a pushed/public commit';
    return 'invalid commit hash. Use the incident commit hash shown in the guide or git log: a1b2c3d';
  }

  if (/^git\s+reset\s+--soft\s+HEAD~1$/i.test(command)) {
    if (activeTask !== 'softreset') return 'soft reset only when the active requirement asks you to undo a local unpushed commit';
    if (!labState.publicCommitReverted) return 'revert the public commit before handling the local unpushed commit';
    labState.localCommitReset = true;
    labState.tasks.softreset = true;
    completeIfReady();
    return 'moved HEAD back one commit and kept changes staged';
  }

  if (/^git\s+pull\s+origin\s+main$/i.test(command)) {
    return 'fatal: Need to specify how to reconcile divergent branches. Configure pull.rebase true or false.';
  }

  if (/^git\s+push\s+--force\s+/i.test(command)) {
    return 'avoid plain --force in team repositories; use --force-with-lease after a rebase.';
  }

  return 'Command recorded, but it does not complete the current Phase 2 requirement yet.';
}

function listDirectory(target = '') {
  const requested = target ? normalizeLsTarget(target) : labState.cwd;

  if (requested === '~') {
    return labState.cloned ? labState.repoName : '';
  }

  if (requested === labState.repoName || requested === '') {
    const files = visibleFilesFor(labState.repoName);
    const dirs = visibleDirsFor(labState.repoName);
    if (files.includes('deployment-notes.md')) labState.tasks.filecheck = true;
    if (files.includes('deployment-notes.bak')) labState.tasks.copycheck = true;
    return ['README.md', ...dirs, ...files].join(' ').trim();
  }

  if (requested === `${labState.repoName}/docs` || requested === 'docs') {
    const docsFiles = [...labState.files]
      .filter(file => file.startsWith('docs/'))
      .map(file => file.slice('docs/'.length));
    if (docsFiles.includes('deployment-notes.bak')) labState.tasks.movecheck = true;
    return docsFiles.join(' ').trim();
  }

  return '';
}

function changeDirectory(target) {
  const activeTask = currentTaskKey();
  const originalCwd = labState.cwd;

  if (target === '~' || target === '$HOME') {
    if (activeTask === 'home') labState.tasks.home = true;
    labState.previousCwd = originalCwd;
    labState.cwd = '~';
    return 'moved to home directory';
  }

  if (target === '-') {
    if (!labState.previousCwd) return 'OLDPWD not set';
    const destination = labState.previousCwd;
    labState.previousCwd = originalCwd;
    labState.cwd = destination;
    if (activeTask === 'cdprevious' && isFiveLevelLabsPath(labState.cwd)) labState.tasks.cdprevious = true;
    return labState.cwd;
  }

  if (/^(\.\.\/?)+$/.test(target)) {
    const steps = target.split('/').filter(part => part === '..').length;
    for (let index = 0; index < steps; index += 1) {
      labState.cwd = labState.cwd.includes('/') ? labState.cwd.split('/').slice(0, -1).join('/') : '~';
    }
    if (!labState.cwd) labState.cwd = '~';
    labState.previousCwd = originalCwd;
    if (activeTask === 'stepback' && steps === 3 && labState.createdNestedPath === originalCwd) labState.tasks.stepback = true;
    return `moved to ${labState.cwd}`;
  }

  if (target === labState.repoName && labState.cloned) {
    labState.previousCwd = originalCwd;
    labState.cwd = target;
    labState.tasks.repo = true;
    if (labState.tasks.home) labState.tasks.backrepo = true;
    return `entered ${target}`;
  }

  const nextPath = labState.cwd === '~' ? target : `${labState.cwd}/${target}`;
  if (labState.dirs.has(nextPath) || labState.dirs.has(target)) {
    labState.previousCwd = originalCwd;
    labState.cwd = labState.dirs.has(nextPath) ? nextPath : target;
    if (isFiveLevelLabsPath(labState.cwd)) {
      labState.createdNestedPath = labState.cwd;
      labState.tasks.nested = true;
    }
    return `entered ${labState.cwd}`;
  }

  return `cd: ${target}: No such file or directory`;
}

function createBranch(command) {
  const match = command.match(/^git\s+(?:(?:switch\s+-c|checkout\s+-[cb])|branch)\s+(dev|stage|prod|feature\/onboarding)(?:\s+(dev))?$/i);
  if (!match) return null;

  if (!labState.tasks.repo) return 'move into the cloned repository before creating branches';
  if (!labState.mainSynced) return 'pull the latest origin/main changes before creating branches';

  const branch = match[1].toLowerCase();
  if (branch === 'feature/onboarding' && labState.currentBranch !== 'dev' && match[2] !== 'dev') {
    return 'create feature/onboarding from dev';
  }

  labState.branches.add(branch);
  if (branch === 'feature/onboarding') {
    labState.tasks.feature = true;
  } else {
    labState.tasks[branch] = true;
  }
  if (!/^git\s+branch/i.test(command)) labState.currentBranch = branch;
  return `created branch ${branch}`;
}

function normalizePath(path) {
  if (path === '~') return '~';
  if (path.startsWith('~/')) return `~/${path.slice(2)}`;
  if (path.startsWith('./')) return path.slice(2);
  if (path.startsWith('/home/student/')) return path.slice('/home/student/'.length);
  const resolved = labState.cwd === '~' || path.includes('/') ? path : `${labState.cwd}/${path}`;
  return resolved.startsWith(`${labState.repoName}/`) ? resolved.slice(`${labState.repoName}/`.length) : resolved;
}

function normalizeDirPath(path) {
  path = path.replace(/\/+/g, '/');
  if (path.startsWith('~/')) return path.slice(2);
  if (path.startsWith('./')) path = path.slice(2);
  if (path.startsWith('/home/student/')) return path.slice('/home/student/'.length);
  if (path.startsWith('/')) return path.slice(1);
  if (labState.cwd === '~') return path;
  if (path.startsWith(`${labState.repoName}/`)) return path;
  return `${labState.cwd}/${path}`;
}

function isRootPath(path) {
  return path.startsWith('/') && !path.startsWith('/home/student/');
}

function normalizeLsTarget(target) {
  if (!target || target === '.') return labState.cwd;
  if (target === '~' || target === '$HOME') return '~';
  if (target.startsWith('./')) target = target.slice(2);
  if (target.startsWith('/home/student/')) return target.slice('/home/student/'.length);
  if (labState.cwd === '~') return target;
  if (target.startsWith(`${labState.repoName}/`)) return target;
  return `${labState.cwd}/${target}`;
}

function addDirectoryPath(path) {
  const parts = path.split('/').filter(Boolean);
  for (let index = 1; index <= parts.length; index += 1) {
    labState.dirs.add(parts.slice(0, index).join('/'));
  }
}

function isFiveLevelLabsPath(path) {
  if (!labState.repoName) return false;
  const prefix = `${labState.repoName}/labs/`;
  if (!path.startsWith(prefix)) return false;
  return path.slice(prefix.length).split('/').filter(Boolean).length >= 5;
}

function isInsideRepo() {
  return Boolean(labState.repoName && (labState.cwd === labState.repoName || labState.cwd.startsWith(`${labState.repoName}/`)));
}

function isAtRepoRoot() {
  return Boolean(labState.repoName && labState.cwd === labState.repoName);
}

function visibleFiles() {
  return visibleFilesFor(labState.cwd);
}

function visibleFilesFor(path) {
  const prefix = path === '~' ? '' : `${path}/`;
  return [...labState.files]
    .filter(file => file.startsWith(prefix) || !file.includes('/'))
    .map(file => file.startsWith(prefix) ? file.slice(prefix.length) : file);
}

function visibleDirsFor(path) {
  const prefix = path === '~' ? '' : `${path}/`;
  const children = new Set();
  labState.dirs.forEach(dir => {
    if (!dir.startsWith(prefix) || dir === path) return;
    const child = dir.slice(prefix.length).split('/')[0];
    if (child) children.add(child);
  });
  return [...children];
}

function copyFile(source, destination) {
  if (!isInsideRepo()) return 'move back into devopspro-training-site before copying work files';
  if (!labState.files.has(source)) return `${source} does not exist yet`;
  if (destination === '~') destination = `~/${source.split('/').pop()}`;
  labState.files.add(destination);
  if (source === 'deployment-notes.md' && destination === 'deployment-notes.bak') labState.tasks.copy = true;
  if (currentTaskKey() === 'copyhome' && source.endsWith('/path-check.txt') && destination === '~/path-check.txt') {
    labState.tasks.copyhome = true;
  }
  return `copied ${source} to ${destination}`;
}

function moveFile(source, destination) {
  if (!isInsideRepo()) return 'move back into devopspro-training-site before moving work files';
  if (!labState.files.has(source)) return `${source} does not exist yet`;
  const destinationDir = destination.includes('/') ? destination.split('/').slice(0, -1).join('/') : '';
  if (destinationDir && !labState.dirs.has(destinationDir) && !labState.dirs.has(`${labState.repoName}/${destinationDir}`)) {
    return `create the destination directory first: mkdir ${destinationDir}`;
  }
  labState.files.delete(source);
  labState.files.add(destination);
  if (source === 'deployment-notes.bak' && destination === 'docs/deployment-notes.bak') labState.tasks.move = true;
  return `moved ${source} to ${destination}`;
}

function gitStatus() {
  const staged = labState.stagedFiles.size ? `\nChanges to be committed:\n  ${[...labState.stagedFiles].join('\n  ')}` : '';
  const untracked = [...labState.files].filter(file => !labState.stagedFiles.has(file));
  const untrackedText = untracked.length ? `\nUntracked files:\n  ${untracked.join('\n  ')}` : '';
  const clean = !staged && !untrackedText ? '\nnothing to commit, working tree clean' : '';
  return `On branch ${labState.currentBranch}${staged}${untrackedText}${clean}`;
}

if (terminalForm && terminalInput) {
  accessForm?.addEventListener('submit', event => {
    event.preventDefault();
    const codeInput = accessForm.querySelector('#lab-code');
    const code = codeInput?.value.trim().toUpperCase();
    if (code === 'DEVOPS-LAB') {
      accessFeedback.textContent = 'Access granted.';
      unlockLab();
    } else {
      accessFeedback.textContent = 'Invalid code. Use DEVOPS-LAB for this preview.';
    }
  });

  terminalForm.addEventListener('submit', event => {
    event.preventDefault();
    if (isOptionTask()) return;
    const command = terminalInput.value.trim();
    if (!command) return;
    const beforeTasks = { ...labState.tasks };
    const response = processCommand(command);
    terminalInput.value = '';
    if (response) appendTerminal(response);
    enforceLinearProgress(beforeTasks, command);
    updateLabUi();
    completeIfReady();
    scrollCurrentTaskIntoView();
    focusActiveInput();
  });

  terminalInput.addEventListener('paste', event => {
    event.preventDefault();
    appendTerminal('Paste is disabled. Type the command manually.', 'err');
  });

  terminalInput.addEventListener('drop', event => {
    event.preventDefault();
    appendTerminal('Drop input is disabled. Type the command manually.', 'err');
  });

  choiceOptions?.addEventListener('click', event => {
    const button = event.target.closest('.choice-option');
    if (!button) return;
    handleChoiceSelection(button);
  });

  terminalInput.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      appendTerminal('Paste shortcut blocked for this lab.', 'err');
    }
  });

  resetButton?.addEventListener('click', resetLab);
  labStartButton?.addEventListener('click', openTestingLab);

  updateLabUi();
  if (lab?.dataset.autoStart === 'true') openTestingLab();
}

if (resultPanel) {
  const storedResult = window.localStorage?.getItem('devopsLabResult');
  const result = storedResult ? JSON.parse(storedResult) : null;
  const passed = result?.status === 'passed';
  const workflow = result?.workflow || 'Phase 1 repository onboarding';
  const retryLabId = result?.labId || (result?.phase === '2' ? 'git-2' : result?.phase === 'linux-1' ? 'linux-1' : result?.phase === 'docker-1' ? 'docker-1' : result?.phase === 'terraform-1' ? 'terraform-1' : 'git-1');
  const labName = result?.labName || labDisplayName(retryLabId);
  const retryHref = `lab.html?lab=${retryLabId}`;
  resultPanel.innerHTML = result ? `
    <div class="result-heading">
      <div class="result-mark" aria-hidden="true">${passed ? '🎉' : '❌'}</div>
      <div>
        <h1>${passed ? 'Congratulations!' : `${labName} failed.`}</h1>
        <span class="lab-kicker">${labName} ${passed ? 'Passed' : 'Failed'}</span>
      </div>
    </div>
    <p>${passed ? `You passed ${labName} and completed the ${workflow} workflow.` : `Review the missed requirements in ${labName}, then retry the ${workflow} workflow.`}</p>
    <div class="result-grid" aria-label="Lab score">
      <div><strong>${result.passed}</strong><span>Passed</span></div>
      <div><strong>${result.failed}</strong><span>Failed</span></div>
      <div><strong>${result.total}</strong><span>Total</span></div>
    </div>
    <div class="result-actions">
      <a class="btn btn-p" href="${retryHref}">Retry Lab</a>
      <a class="btn btn-o" href="labs.html">Back to Briefing</a>
    </div>
  ` : `
    <div class="result-heading">
      <div class="result-mark" aria-hidden="true">ℹ️</div>
      <div>
        <span class="lab-kicker">No Result</span>
        <h1>No lab result found.</h1>
      </div>
    </div>
    <p>Start the lab and complete or fail an attempt to generate a score.</p>
    <div class="result-actions">
      <a class="btn btn-p" href="lab.html?lab=git-1">Start Lab</a>
      <a class="btn btn-o" href="labs.html">Back to Briefing</a>
    </div>
  `;
  resultPanel.classList.toggle('result-pass', Boolean(passed));
  resultPanel.classList.toggle('result-fail', Boolean(result && !passed));
}
