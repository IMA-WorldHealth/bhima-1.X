Bhima Models
============

This document describes the contents of the `/models` directory.

The directory contents are listed below:
```bash
- models/
  - base.sql
  - bhima.sql
  - base.sql
  - generic.sql
  - README      # This README
  - updates/
    - mod-1.sql 
    # etc ...
```

#### bhima.sql

`bhima.sql` defines the main schema of the database.  It contains all
the model CREATE statements, as well as TRIGGERS and KEY dependencies.
Furthermore, it will drop the current bhima instance and create a new
one from scratch if executed multiple times.

#### base.sql

`base.sql` contains mock data for testing the application.  The BHIMA
application is currently undergoing testing in a remote hospital.
Data from that test is included in `base.sql` to avoid repetative tasks,
such as creating enterprise, projects, wards, fiscal years, and so on
for ever schema change.

#### stock.sql (Deprecated)

`stock.sql` is a deprecated file.  It's purpose is now overshadowed by
`base.sql`; however, it is often still used for addition to the database
on the fly.  Historically, it filled in stock tables while inventory 
management features in BHIMA were under development.

#### build.sql

`build.sql` is a wrapper for running `bhima.sql`, `base.sql` and `stock.sql`
in rapid succession. It "builds" a complete hospital.

#### generic.sql

`generic.sql` is a work in progress.  Ideally, it should model a completely
generic hospital, rather than the specific test site of BHIMA.

#### updates/

`updates` is a folder that contains upgrade scripts for development.  These
scripts upgrade the database on the fly, without having to rebuild the entire
schema.  They should reflect changes which have been implimented in `bhima.sql`.
