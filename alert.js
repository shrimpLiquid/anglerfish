function myFunction() {
  // Your code here
  alert("Button clicked!");
}

// Wait for the DOM to load before attaching the listener
document.addEventListener('DOMContentLoaded', (event) => {
  const button = document.getElementById('myButton');
  if (button) {
    button.addEventListener('click', myFunction);
  }
});