import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { exec } from 'child_process';

async function deployMessage({ currentMessage }: { currentMessage: string }) {
  const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
    }).trim(),
    buildDeployBranch = `[build] [deploy] [${
      currentBranch == 'main'
        ? 'production'
        : currentBranch == 'develop'
        ? 'staging'
        : ''
    }]`;

  let commitMessage = currentMessage + buildDeployBranch;

  return commitMessage;
}

export async function promptUser() {
  execSync('git add .', {
    encoding: 'utf-8',
  });

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'commitType',
      message: 'Select commit type:',
      choices: ['feature', 'bug', 'review', 'enhancement', 'redeploy'],
    },
  ]);

  let commitMessage: string;

  if (answers.commitType === 'redeploy') {
    const additionalAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'whyRedeploy',
        message: 'Why redeploy:',
      },
    ]);

    commitMessage = `[${answers.commitType}] ${additionalAnswers.whyRedeploy}`;
  } else {
    const additionalAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskHash',
        message: 'Enter task hash:',
      },
      {
        type: 'input',
        name: 'commitTitle',
        message: 'Enter commit title:',
      },
    ]);

    commitMessage = `[${answers.commitType}][${additionalAnswers.taskHash}] ${additionalAnswers.commitTitle}`;
  }

  const commitActions = await inquirer.prompt([
    {
      type: 'list',
      name: 'commitActions',
      message: 'Select commit action:',
      choices: ['commit', 'deploy'],
    },
  ]);

  if (commitActions.commitActions === 'deploy' && answers != 'redeploy') {
    commitMessage = await deployMessage({
      currentMessage: commitMessage,
    });
  }

  console.log('Commit Message:', commitMessage);

  // Git commit command
  const gitCommand = `git commit --allow-empty -m "${commitMessage}"`;

  // Execute the git commit command
  exec(gitCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during git commit: ${error.message}`);
      return;
    }
    console.log('Git commit successful:', stdout);
  });
}
