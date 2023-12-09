const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { utils } = require("ethers")
const { expect } = require("chai");

describe("WrappedElon", () => {
  async function deployWrappedElonFixture() {
    const signer = (await hre.ethers.getSigners())[0]
    const notOwner = (await hre.ethers.getSigners())[1]
    const WrappedElon = await ethers.getContractFactory("WrappedElon");
    const wrappedElon = await WrappedElon.deploy();
    const elonAddress = await wrappedElon.elon()
    const mockErc20Artifact = await hre.artifacts.readArtifact("MockERC20")
    await hre.network.provider.send('hardhat_setCode', [elonAddress, mockErc20Artifact.deployedBytecode])
    const elon = await hre.ethers.getContractAt("MockERC20", elonAddress)
    await elon.mintTo(signer.address, 10_000_000_000_000_000n)
    return { elon, wrappedElon, signer, notOwner };
  }

  describe("Deployment", () => {
    it("should have elon address set correctly", async function () {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);
      expect(await wrappedElon.elon()).to.equal(elon.address);
    });
  });
  describe("WrappedElon", () => {
    it("fails if minimum elon amount is not met", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);
      const insufficientDogelon = 99_999_999_999_999
      await elon.approve(wrappedElon.address, insufficientDogelon)
      await expect(wrappedElon.wrap(insufficientDogelon)).to.be.revertedWith("Can only wrap 0.0001 ELON or greater");
    });

    it("wraps minimally", async () => {
      const { elon, wrappedElon, signer } = await loadFixture(deployWrappedElonFixture);
      const elonAmount = 100_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      const elonBalanceBefore = await elon.balanceOf(signer.address)
      await wrappedElon.wrap(elonAmount)
      const elonBalanceAfter = await elon.balanceOf(signer.address)
      const wrappedBalance = await wrappedElon.balanceOf(signer.address)
      expect(elonBalanceBefore.sub(elonBalanceAfter).eq(elonAmount)).to.be.true
      expect(wrappedBalance.eq(1)).to.be.true
    })

    it("wraps non-minimally (rounding down)", async () => {
      const { elon, wrappedElon, signer } = await loadFixture(deployWrappedElonFixture);
      const elonAmount = 1_099_999_999_999_999
      const wrappableElon = 1_000_000_000_000_000 // Round down
      await elon.approve(wrappedElon.address, elonAmount)
      const elonBalanceBefore = await elon.balanceOf(signer.address)
      await wrappedElon.wrap(elonAmount)
      const elonBalanceAfter = await elon.balanceOf(signer.address)
      const wrappedBalance = await wrappedElon.balanceOf(signer.address)
      expect(elonBalanceBefore.sub(elonBalanceAfter).eq(wrappableElon)).to.be.true
      expect(wrappedBalance.eq(10)).to.be.true
    })

    it("wraps the same amount with different precision", async () => {
      const { elon, wrappedElon, signer } = await loadFixture(deployWrappedElonFixture);
      const elonAmount = 100_000_000_000_000 // 0.0001 ELON
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)
      const wrappedBalance = await wrappedElon.balanceOf(signer.address)
      const formattedElonAmount = utils.formatUnits(elonAmount, 18)
      const formattedWrappedAmount = utils.formatUnits(wrappedBalance, 4)
      expect(formattedElonAmount).eq('0.0001')
      expect(formattedElonAmount).eq(formattedWrappedAmount)
    })

    it("fails to wrap when disabled", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);
      await wrappedElon.setEnabledState(false, true);
      const elonAmount = 100_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await expect(wrappedElon.wrap(elonAmount)).to.be.revertedWith("Wrapping currently disabled");
    })

    it("wraps after enabling from disabled state", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);
      await wrappedElon.setEnabledState(false, true);
      await wrappedElon.setEnabledState(true, true);
      const elonAmount = 100_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await expect(wrappedElon.wrap(elonAmount)).to.not.be.reverted
    })
  })

  describe("Unwrap", () => {
    it("fails if unwrap amount is greater than balance", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);

      // Wrap
      const elonAmount = 1_000_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)

      // Unwrap more than balance
      const unwrapPromise = wrappedElon.unwrap(11)
      await expect(unwrapPromise).to.be.revertedWith('ERC20: burn amount exceeds balance')
    })

    it("fails if unwrap amount is zero", async () => {
      const { wrappedElon } = await loadFixture(deployWrappedElonFixture);
      const unwrapPromise = wrappedElon.unwrap(0)
      await expect(unwrapPromise).to.be.revertedWith("Cannot unwrap zero tokens")
    })

    it("unwraps partially", async () => {
      const { elon, wrappedElon, signer } = await loadFixture(deployWrappedElonFixture);

      // Wrap
      const elonAmount = 1_000_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)
      const elonAmountBeforeUnwrap = await elon.balanceOf(signer.address)

      // Unwrap half
      await wrappedElon.unwrap(5)
      const elonAmountAfterUnwrap = await elon.balanceOf(signer.address)
      const wrappedAmountAfterUnwrap = await wrappedElon.balanceOf(signer.address)

      expect(elonAmountAfterUnwrap.sub(elonAmountBeforeUnwrap).eq(500_000_000_000_000)).to.be.true
      expect(wrappedAmountAfterUnwrap.eq(5)).to.be.true
    })

    it("unwraps absolutely", async () => {
      const { elon, wrappedElon, signer } = await loadFixture(deployWrappedElonFixture);

      // Wrap
      const elonAmount = 1_000_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)
      const elonAmountAfterWrap = await elon.balanceOf(signer.address)

      // Unwraps everything
      await wrappedElon.unwrap(10)
      const elonAmountAfterUnwrap = await elon.balanceOf(signer.address)
      const wrappedAmountAfterUnwrap = await wrappedElon.balanceOf(signer.address)

      expect(elonAmountAfterUnwrap.sub(elonAmountAfterWrap).eq(1_000_000_000_000_000)).to.be.true
      expect(wrappedAmountAfterUnwrap.eq(0)).to.be.true
    })

    it("fails to unwrap when disabled", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);

      // Wrap
      const elonAmount = 1_000_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)

      // Disable + Unwrap
      await wrappedElon.setEnabledState(true, false);
      await elon.approve(wrappedElon.address, elonAmount)
      await expect(wrappedElon.unwrap(10)).to.be.revertedWith("Unwrapping currently disabled");
    })

    it("unwraps after enabling from disabled state", async () => {
      const { elon, wrappedElon } = await loadFixture(deployWrappedElonFixture);

      // Wrap
      const elonAmount = 1_000_000_000_000_000
      await elon.approve(wrappedElon.address, elonAmount)
      await wrappedElon.wrap(elonAmount)

      // Disable + Unwrap
      await wrappedElon.setEnabledState(true, false);
      await wrappedElon.setEnabledState(true, true);
      await elon.approve(wrappedElon.address, elonAmount)
      await expect(wrappedElon.unwrap(10)).to.not.be.reverted
    })
  })

  describe("Only owner", () => {
    it("fails when non-owner tries to set enabled state", async () => {
      const { wrappedElon, notOwner } = await loadFixture(deployWrappedElonFixture);
      await expect(wrappedElon.connect(notOwner).setEnabledState(false, false)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })
  })
});

describe("Max Uint64", () => {
  it("makes sure that ELON's total supply, when truncated to 4 decimals fits in max uint64", async () => {
    const elonTotalSupply = 1000000000000000_000000000000000000n
    const maxUint64       = 18446744073709551615n
    const elonDecimals = 18n
    const wrappedElonDecimals = 4n
    const decimalsToRemove = elonDecimals - wrappedElonDecimals
    const adjustedSupply = elonTotalSupply/(10n**decimalsToRemove)
    expect(adjustedSupply).to.be.lessThanOrEqual(maxUint64)
  })
})