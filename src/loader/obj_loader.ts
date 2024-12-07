export async function load_obj_model(path: string) {
  const response = await fetch(path);
  const content = await response.text();
  const lines = content.split('\n');

  console.log(lines);
}
