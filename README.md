# devopspro-aws-cloudfront-s3
# DevOps Pro — AWS Static Website Deployment

A production-style static website deployed on AWS using Amazon S3, CloudFront, Route 53 and AWS Certificate Manager (ACM).

**Live Website:** https://devopspro.uk

## Project Overview

This project demonstrates the deployment of a static training website using AWS cloud services, with private S3 origin access, HTTPS, custom domain management and DNS troubleshooting.

The deployment also involved recovering a CloudFront custom domain association from an inaccessible AWS account.

## Architecture

```text
Users
  |
  v
devopspro.uk (GoDaddy)
  |
  v
Amazon Route 53 (DNS)
  |
  v
Amazon CloudFront (HTTPS + CDN)
  |
  v
Origin Access Control (OAC)
  |
  v
Amazon S3 (Private Website Bucket)
```

## Technologies Used

- Amazon S3 — Static website files
- Amazon CloudFront — Content delivery and caching
- AWS Certificate Manager — HTTPS certificate
- Amazon Route 53 — DNS management
- GoDaddy — Domain registration
- AWS CLI — Configuration and troubleshooting
- Git and GitHub — Source control

## Deployment Process

### 1. S3 Website Hosting

Created a private S3 bucket named `devops-prouk` in `us-east-1`.

Uploaded the website files, including HTML, CSS, JavaScript and images.

S3 static website hosting was not required because CloudFront accesses the bucket using the S3 REST endpoint and Origin Access Control.

### 2. CloudFront Configuration

Created CloudFront distribution `E1FO7WCFCQ8FH9`.

Configured:

- S3 bucket as the origin
- Origin Access Control
- Default root object: `index.html`
- HTTPS using an ACM certificate
- Custom domain: `devopspro.uk`

### 3. SSL/TLS Certificate

Requested an ACM certificate for `devopspro.uk` in `us-east-1`.

Used DNS validation through Route 53 and attached the issued certificate to CloudFront.

### 4. Route 53 and GoDaddy

Created a public hosted zone for `devopspro.uk`.

Updated the domain's nameservers at GoDaddy to the four nameservers assigned by Route 53.

Created an A alias record pointing the root domain to the CloudFront distribution.

### 5. Cross-Account CloudFront Domain Migration

During deployment, CloudFront reported that the domain was already associated with another distribution.

Used the AWS CLI to identify the conflicting resource.

Created a DNS TXT record to verify domain ownership and migrated the domain association using the CloudFront `update-domain-association` API with an ETag.

Successfully associated the domain with the new CloudFront distribution without access to the previous AWS account.

### 6. DNS Troubleshooting

Investigated DNS resolution errors including `NXDOMAIN` and `SERVFAIL`.

Used:

- `dig` to investigate DNS resolution
- Public DNS resolvers for comparison
- DNSSEC-related diagnostic queries
- `curl` to verify HTTPS responses
- AWS CLI to inspect Route 53 and CloudFront configurations

The website was eventually verified with an HTTP 200 response and confirmed working in a browser.

## Verification

The following components were successfully verified:

- CloudFront distribution deployed
- Custom domain associated with CloudFront
- Route 53 A alias configured
- HTTPS response returned HTTP 200
- Website files served through CloudFront and S3
- Homepage and images displayed correctly

## Key Lessons Learned

- DNS delegation and CloudFront domain association are separate configurations.
- Private S3 origins can be secured using CloudFront OAC.
- ACM certificates for CloudFront must be created in `us-east-1`.
- CloudFront cross-account domain conflicts can require domain ownership verification and ETag-based migration.
- DNS troubleshooting should distinguish authoritative DNS, recursive resolvers, DNSSEC and local network configuration.
- HTTP response headers are useful for verifying CDN and origin behaviour.

## Future Improvements

- GitHub Actions CI/CD pipeline
- AWS OIDC authentication for GitHub Actions
- Automated S3 deployment
- CloudFront cache invalidation
- Infrastructure as Code using Terraform

## Author

GitHub: https://github.com/Kehindeomotayo

Website: https://devopspro.uk
