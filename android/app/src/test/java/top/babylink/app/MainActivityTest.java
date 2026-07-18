package top.babylink.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class MainActivityTest {
	@Test
	public void treatsEntryPagesAsRootRoutes() {
		assertTrue(MainActivity.isRootPath(null));
		assertTrue(MainActivity.isRootPath(""));
		assertTrue(MainActivity.isRootPath("/"));
		assertTrue(MainActivity.isRootPath("/home"));
		assertTrue(MainActivity.isRootPath("/home/"));
		assertTrue(MainActivity.isRootPath("/access"));
		assertTrue(MainActivity.isRootPath("/access/"));
	}

	@Test
	public void keepsNestedRoutesNavigable() {
		assertFalse(MainActivity.isRootPath("/settings"));
		assertFalse(MainActivity.isRootPath("/chats/123456"));
		assertFalse(MainActivity.isRootPath("/offline/123456"));
	}
}