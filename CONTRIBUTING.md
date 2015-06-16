Contributor's Guide
=======================

 - Project page: https://github.com/IMA-WorldHealth/bhima
 - Email us: bhimateam@gmail.com

Your first contribution
------------------

Before contributing to the bhima codebase, we ask that you sign a [Contributor License Agreement](https://en.wikipedia.org/wiki/Contributor_License_Agreement)
for [individuals](./contributors/individual-cla.md) or [entities](./contributors/entity-cla.md). To do so, please create a file with a name like
`/contributors/{github_username}.md` and in the content of that file indicate your agreement.  Be sure to include your agreement in the first pull request you make!
An example of this method of agreement can be seen [here](./contributors/jniles.md).

This type of agreement was inspired by [adam-p](https://github.com/adam-p/markdown-here/blob/master/CONTRIBUTING.md)'s CLA.  Thanks!

Types of contribution
---------------------

### Code Development

Bhima is always in need of work on its code base.  If you haven't done so already, fork and [install](./INSTALL) the bhima repository locally.
All pull requests are made against the `development` branch.

### Translation

Bhima is international software.  Our development team works in both French and English, but would love to round out our supported languages!
If you would like to get involved in translation work, you can either translate documentation
(see the [user manual](https://github.com/IMA-WorldHealth/bhima/tree/development/docs/BHIMA%20User%20Guide)) or the application itself.  We use
[angular-translate](https://github.com/angular-translate/angular-translate) for all client-side translation.  The files are located in
`client/src/i18n/{locale}.json`.  Feel free to translate the key-value pairs and store it in your own langage.



Contributor Tips & Tricks
-------------

Some helpful tips for code organization:

1) Pick a good branch name for clarity.  Below are some examples of good naming schemes.
 - `features/patient-discharge-form`   implements a new feature for a patient discharge
 - `patches/fiscal-year-transfer`      adds in missing (but intended) functionality transfering budgets between fiscal years
 - `fixes/posting-journal-bug-1193`    fixes bug #1193 in the posting ouranl
 - `docs/budget-documentation`         adds in documentation for the budgeting module

2) Include `fix {#}`, `fixes {#}` in your git commits to link issues.  Link issues to pull requests
to track progress.  Examples can be seen [here](https://github.com/jmcameron/bhima/commit/c5441fdf0246ca3b3efa63786064751974971777)
and [here](https://github.com/IMA-WorldHealth/bhima/issues/306)).
