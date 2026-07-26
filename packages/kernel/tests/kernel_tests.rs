#[cfg(test)]
mod tests {
    use unix_browser_kernel::syscall::SyscallDispatcher;
    use unix_browser_kernel::vfs::NodeType;

    #[test]
    fn test_vfs_hierarchy_init() {
        let dispatcher = SyscallDispatcher::new();
        let stat = dispatcher.sys_stat("/home/user").expect("stat /home/user failed");
        assert_eq!(stat.node_type, NodeType::Directory);
    }

    #[test]
    fn test_file_create_write_read() {
        let dispatcher = SyscallDispatcher::new();
        let fd = dispatcher.sys_open("/tmp/test.txt", 64 | 2, 0o644).expect("open failed");
        let data = b"Unix OS on Wasm browser";
        let written = dispatcher.sys_write(fd, data).expect("write failed");
        assert_eq!(written, data.len());
        dispatcher.sys_close(fd).unwrap();

        let fd2 = dispatcher.sys_open("/tmp/test.txt", 0, 0).expect("reopen failed");
        let mut buf = vec![0u8; 64];
        let read_bytes = dispatcher.sys_read(fd2, &mut buf).expect("read failed");
        assert_eq!(read_bytes, data.len());
        assert_eq!(&buf[..read_bytes], data);
    }
}
