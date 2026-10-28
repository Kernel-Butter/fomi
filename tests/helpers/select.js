export async function chooseOption(combobox, label) {
  await combobox.click();
  await combobox
    .page()
    .getByRole("option", { name: label, exact: true })
    .click();
}
export function selectedControl(scope, name) {
  return scope
    .locator(".studio-select")
    .filter({ has: scope.page().getByRole("combobox", { name, exact: true }) });
}
