# Legacy URLs of the WordPress site. Amplify has no .htaccess, so the rules live here and become the app's
# "Rewrites and redirects". The single source of truth is seo-baseline/redirects.formworkforconcrete.com.csv (the rows
# of the shared redirects file for this site); nothing is typed twice.
#
# Every entry is written without a trailing slash; the locals below add the "/" variant too, because Amplify matches
# the path exactly. Rules apply top to bottom. A target that is a file (an old attachment page) must exist in public/.
#
# There is deliberately no catch-all "/<*>" -> 404 page rule: a 404-type rule makes Amplify answer 302 to the page,
# which then returns 200 (a soft 404 for Google). Without the rule Amplify returns a real 404. Prefer the correct
# status over a branded 404 page. (Same decision as oceanbim.com.)

locals {
  redirect_csv = csvdecode(file("${path.module}/../seo-baseline/redirects.formworkforconcrete.com.csv"))

  # one entry per source path, without the trailing slash
  legacy_redirects = {
    for r in local.redirect_csv : (length(r.from) > 1 ? trimsuffix(r.from, "/") : r.from) => r.to...
  }

  # The old site answers a page URL without the trailing slash with a 301 to the slash version (/projects is in Search
  # Console with impressions). Written out for every kept page so it does not depend on how Amplify treats a directory path.
  pages_csv = csvdecode(file("${path.module}/../seo-baseline/formworkforconcrete.com.pages.csv"))
  kept_paths = [
    for p in local.pages_csv : replace(p.url, "https://formworkforconcrete.com", "")
    if !contains(keys(local.legacy_redirects), trimsuffix(replace(p.url, "https://formworkforconcrete.com", ""), "/"))
  ]
  slash_redirects = { for p in local.kept_paths : trimsuffix(p, "/") => p if p != "/" }

  redirect_rules = concat(
    # www -> apex. Amplify's default is the opposite (apex -> www); the canonical URLs use the apex.
    var.custom_domain_name == null ? [] : [{
      source = "https://www.${var.custom_domain_name}"
      target = "https://${var.custom_domain_name}"
      status = "301"
    }],
    flatten([
      for from, to in local.legacy_redirects : concat(
        [{ source = from, target = to[0], status = "301" }],
        # no "/" variant for files such as /sitemap_index.xml
        endswith(from, ".xml") ? [] : [{ source = "${from}/", target = to[0], status = "301" }],
      )
    ]),
    [for from, to in local.slash_redirects : { source = from, target = to, status = "301" }],
  )
}
