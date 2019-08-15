provider "google" {
  credentials = "${file("${var.gcp_service_acc_json_path}")}"
  project     = "${var.gcp_project}"
  region      = "${var.gcp_region}"
  zone        = "${var.gcp_zone}"
}
