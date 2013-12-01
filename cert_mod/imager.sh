#!/bin/sh

log "nssdb: Started"
log "nssdb: Starting SquashFS Edit"
ROOTFS="$(begin_squashfs_edit 'rootfs')"
log "nssdb: SquashFS Mounted"
mv ./nssdb/* "${ROOTFS}/etc/pki/nssdb"
mv ./hosts "${ROOTFS}/etc/hosts"
end_squashfs_edit "$ROOTFS"
log "nssdb: Done!"
