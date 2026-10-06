# Legacy URLs of the WordPress site. Amplify has no .htaccess, so the rules live here and become the app's
# "Rewrites and redirects". The single source of truth is seo-baseline/redirects.formworkforconcrete.com.csv (the rows
# of the shared redirects file for this site); nothing is typed twice.
#
# Every entry is written without a trailing slash; the locals below add the "/" variant too, because Amplify matches
# the path exactly. Rules apply top to bottom.
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

  redirect_rules = concat(
    # www -> apex. Amplify's default is the opposite (apex -> www); the canonical URLs use the apex.
    var.custom_domain_name == null ? [] : [{
      source = "https://www.${var.custom_domain_name}"
      target = "https://${var.custom_domain_name}"
      status = "301"
    }],
    flatten([
      for from, to in local.legacy_redirects : [
        { source = from, target = to[0], status = "301" },
        { source = "${from}/", target = to[0], status = "301" },
      ]
    ]),
  )
}
