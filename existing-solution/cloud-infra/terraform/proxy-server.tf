resource "google_compute_instance" "iex-cloud-existing-solution-proxy-server" {
  name         = "iex-cloud-existing-solution-proxy-server"
  machine_type = "g1-small"

  boot_disk {
    initialize_params {
      image = "ubuntu-1904-disco"
    }
  }
  
  // Local SSD disk
  scratch_disk {
  }

  network_interface {
    # A default network is created for all GCP projects
    network       = "default"
    access_config {
    }
  }

  metadata = {
    Name     = "iex-cloud-existing-solution-proxy-server"
    ssh-keys = "${var.gcp_ssh_user}:${file("${var.gcp_public_key_path}")}"
  }

  metadata_startup_script = "echo hi > /test.txt"

  #############################################################################
  # This is the 'local exec' method.  
  # Ansible runs from the same host you run Terraform from
  #############################################################################

  provisioner "remote-exec" {
    inline = ["echo 'Hello World'"]

    connection {
      host        = "${google_compute_instance.iex-cloud-existing-solution-proxy-server.network_interface.0.access_config.0.nat_ip}"
      type        = "ssh"
      user        = "${var.gcp_ssh_user}"
      private_key = "${file("${var.gcp_private_key_path}")}"
    }
  }
  provisioner "local-exec" {
    command = "ansible-playbook -i ${google_compute_instance.iex-cloud-existing-solution-proxy-server.network_interface.0.access_config.0.nat_ip}, --private-key ${var.gcp_private_key_path} ../ansible/proxy-server.yml"
  }
}
