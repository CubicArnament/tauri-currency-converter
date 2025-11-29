{
  description = "Development environment for the Tauri Currency Converter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    crane.url = "github:ipetkov/crane";
    fenix.url = "github:nix-community/fenix";
  };

  outputs = { self, nixpkgs, flake-utils, crane, fenix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Get the stable Rust toolchain
        rustToolchain = fenix.packages.${system}.stable.toolchain;

        # Use crane to build Rust dependencies
        craneLib = crane.lib.${system}.overrideToolchain rustToolchain;

        # Project source
        src = ./.;
        tauri-src = ./src-tauri;

        # Build only the Cargo dependencies to cache them
        cargoArtifacts = craneLib.buildDepsOnly {
          src = tauri-src;
          nativeBuildInputs = with pkgs; [
            pkg-config
          ];
          buildInputs = with pkgs; [
            # Tauri's Linux dependencies
            webkitgtk
            gtk3
            glib
            dbus
            openssl
            librsvg
          ];
        };

      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # Frontend dependencies
            nodejs_20 # Using LTS Node.js

            # Backend dependencies
            rustToolchain

            # System libraries for Tauri
            webkitgtk
            gtk3
            glib
            dbus
            openssl
            librsvg
            appstream
            desktop-file-utils

            # Build tools
            pkg-config
            clang
            llvmPackages.bintools
          ];

          # Environment setup for the development shell
          shellHook = ''
            # Point Cargo to the cached dependencies to speed up builds
            export CARGO_TARGET_DIR="target"
            mkdir -p target
            ln -sf ${cargoArtifacts} target/debug
            echo ""
            echo "----------------------------------------------------"
            echo "  Welcome to the Tauri Currency Converter shell!  "
            echo "----------------------------------------------------"
            echo ""
            echo "  To get started:"
            echo "    1. Run 'npm install' to fetch frontend packages."
            echo "    2. Run 'npm run tauri dev' to start the app."
            echo ""
          '';
        };
      }
    );
}
