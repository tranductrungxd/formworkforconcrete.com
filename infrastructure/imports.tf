# Adopts the console-created Amplify app and its branch the first time var.amplify_app_id is set.
# Both blocks are no-ops while the id is null and after the resources are in state.

import {
  for_each = local.has_amplify_app ? toset([var.amplify_app_id]) : toset([])
  to       = aws_amplify_app.this[0]
  id       = each.value
}

import {
  for_each = local.has_amplify_app ? toset([var.amplify_app_id]) : toset([])
  to       = aws_amplify_branch.main[0]
  id       = "${each.value}/${var.amplify_branch_name}"
}
